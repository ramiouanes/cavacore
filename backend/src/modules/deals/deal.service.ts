import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deal, DealStage, DealStatus, ParticipantRole } from './entities/deal.entity';
import {
  CreateDealDto,
  UpdateDealDto,
  AddParticipantDto,
  UpdateParticipantDto,
  StageTransitionValidation,
  ParticipantValidationResult,
  ValidationRequestDto,
  TimelineEntryDto,
  StageRequirementsResponse,
  DealDocument
} from './dto/deal.dto';
import { Horse } from '../horses/entities/horse.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FileLogger } from '../../utils/logger';
import { DealStageManager } from './services/deal-stage-manager.service';
import { StatusManager } from './services/status-manager.service';
import { TimelineManager } from './services/timeline-manager.service';
import { ProcessValidator, ValidationResult } from './services/process-validator.service';
import { FileService } from '../shared/services/file.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TimelineEntry, TimelineEventType } from './interfaces/timeline.interface';
import JSZip from 'jszip';
import { DealEventsGateway } from './gateways/deal-events.gateway';
import { DealEventType } from './interfaces/deal-events.interface';
import * as path from 'path';
import { UserService } from '../users/user.service';
import { v4 as uuidv4 } from 'uuid';

interface SearchParams {
  type?: string;
  stage?: DealStage;
  status?: DealStatus;
  horseId?: string;
  userId?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DocumentDownloadService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>
  ) { }

  async getDocument(dealId: string, documentId: string): Promise<DealDocument | undefined> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');
    
    return deal.documents.find(doc => doc.id === documentId);
  }

  async downloadDocument(dealId: string, documentId: string): Promise<DealDocument | undefined> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const document = deal.documents.find(doc => doc.id === documentId);
    if (!document) throw new NotFoundException('Document not found');

    try {
      if (!document.url) throw new BadRequestException('Document URL is undefined');
      const response = await fetch(document.url);
      if (!response.ok) throw new BadRequestException('Failed to fetch document');

      // const buffer = await response.arrayBuffer();
      return document
    } catch (error) {
      throw new BadRequestException('Error downloading document');
    }
  }

  async downloadMultipleDocuments(dealId: string, documentIds: string[]): Promise<Buffer> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const zip = new JSZip();
    const documents = deal.documents.filter(doc => documentIds.includes(doc.id));

    if (documents.length === 0) {
      throw new NotFoundException('No documents found');
    }

    try {
      await Promise.all(
        documents.map(async (doc) => {
          if (!doc.url) throw new BadRequestException('Document URL is undefined');
          const response = await fetch(doc.url);
          if (!response.ok) return;

          const buffer = await response.arrayBuffer();
          zip.file(doc.name, buffer);
        })
      );

      return await zip.generateAsync({ type: 'nodebuffer' });
    } catch (error) {
      throw new BadRequestException('Error creating document bundle');
    }
  }
}

@Injectable()
// @WebSocketGateway({ namespace: '/deals' })
export class DealService {
  // @WebSocketServer()
  // private server!: Server;

  private logger = FileLogger.getInstance();

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly stageManager: DealStageManager,
    private readonly statusManager: StatusManager,
    private readonly timelineManager: TimelineManager,
    private readonly processValidator: ProcessValidator,
    private readonly fileService: FileService,
    private readonly eventsGateway: DealEventsGateway,
    private readonly userService: UserService
  ) { }


  async approveDocument(
    dealId: string,
    documentId: string,
    userId: string
  ): Promise<Deal> {
    const deal = await this.findDealById(dealId, userId);

    const docIndex = deal.documents.findIndex(doc => doc.id === documentId);
    if (docIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    // Validate user has permission to approve documents
    if (!this.hasPermission(deal, userId, 'approve_documents')) {
      throw new ForbiddenException('Not authorized to approve documents');
    }

    // Update document status
    deal.documents[docIndex] = {
      ...deal.documents[docIndex],
      status: 'approved',
      metadata: {
        ...deal.documents[docIndex].metadata,
        reviewedBy: userId,
        reviewDate: new Date()
      }
    };

    // Validate document requirements
  const validation = await this.processValidator.validateDealProcess(deal);
  if (!validation.isValid && validation.errors.some(e => e.field === 'documents')) {
    throw new BadRequestException(
      validation.errors.filter(e => e.field === 'documents').map(e => e.message).join(', ')
    );
  }

    // Add timeline entry
    await this.timelineManager.addDocumentEntry(
      deal,
      'APPROVED',
      documentId,
      userId,
      { previousStatus: DealStatus.PENDING }
    );

    const updatedDeal = await this.dealRepository.save(deal);

    // Notify participants
    this.notifyParticipants(dealId, 'document.approved', {
      documentId,
      documentName: deal.documents[docIndex].name
    }, userId);

    return updatedDeal;
  }

  async rejectDocument(
    dealId: string,
    documentId: string,
    userId: string,
    reason: string
  ): Promise<Deal> {
    const deal = await this.findDealById(dealId, userId);

    const docIndex = deal.documents.findIndex(doc => doc.id === documentId);
    if (docIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    if (!this.hasPermission(deal, userId, 'approve_documents')) {
      throw new ForbiddenException('Not authorized to reject documents');
    }

    deal.documents[docIndex] = {
      ...deal.documents[docIndex],
      status: 'rejected',
      metadata: {
        ...deal.documents[docIndex].metadata,
        reviewedBy: userId,
        reviewDate: new Date(),
        rejectionReason: reason
      }
    };

    await this.timelineManager.addDocumentEntry(
      deal,
      'REJECTED',
      documentId,
      userId,
      {
        previousStatus: DealStatus.PENDING,
        reason
      }
    );

    const updatedDeal = await this.dealRepository.save(deal);

    this.notifyParticipants(dealId, 'document.rejected', {
      documentId,
      documentName: deal.documents[docIndex].name,
      reason
    },
    userId
  );

    return updatedDeal;
  }

  async createDeal(data: any, userId: string): Promise<Deal> {
    try {

      // Validate horse exists and is available
    const horse = await this.horseRepository.findOne({
      where: { id: data.basicInfo.horseId }
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

      // Process document files
      const processedDocuments = await Promise.all(
        data.documents.map(async (doc: any) => {
          if (!doc.buffer) return doc;

          const uploadResult = await this.fileService.uploadFile({
            buffer: doc.buffer,
            originalname: doc.originalname,
            mimetype: doc.mimetype
          }, 'document', doc.id);

          this.logger.log('Upload Done:', uploadResult);

          return {
            ...doc,
            url: uploadResult.url,
            metadata: {
              ...doc.metadata,
              size: doc.buffer.length,
              mimeType: doc.mimetype
            }
          };
        })
      );

      // Add processed documents to deal data
      const dealDocuments = processedDocuments.map((doc: any, index: number) => ({
        id: doc.id,
        documentType: doc.type,
        name: doc.name,
        url: `/uploads/documents/${doc.id}${path.extname(doc.originalname)}`, // Store relative path
        uploadedBy: userId,
        uploadDate: new Date().toISOString(),
        status: 'pending',
        version: 1,
        metadata: {
          size: doc.file?.size,
          mimeType: doc.file?.mimetype
        }
      }));

      // Create a single deal entity
    const deals = this.dealRepository.create({
      ...data,
      type: data.basicInfo.type,
      horseId: data.basicInfo.horseId,
      documents: processedDocuments,
      status: DealStatus.ACTIVE,
      stage: DealStage.INITIATION
    });

    const deal = Array.isArray(deals) ? deals[0] : deals;

    this.logger.log('deal to be created in DB:', deal);

    // Validate deal using ProcessValidator
    const validation = await this.processValidator.validateDealProcess(deal);
    if (!validation.isValid) {
      throw new BadRequestException(
        validation.errors.map(e => e.message).join(', ')
      );
    }

      // Add initial timeline entry
      await this.timelineManager.addTimelineEntry(
        deal,
        TimelineEventType.STAGE_CHANGE,
        'Deal created',
        data.createdBy.id,
        { automatic: true }
      );

      const savedDeal = await this.dealRepository.save(deal);

      console.log('Deal created:', savedDeal);

      // Notify participants
      // this.notifyParticipants(savedDeal.id, 'deal.created', {
      //   dealId: savedDeal.id,
      //   stage: savedDeal.stage,
      //   status: savedDeal.status
      // });

      return savedDeal;

    } catch (error) {
      this.logger.error('Error creating deal:', error);
      throw error;
    }
  }

  async updateStage(
    dealId: string, 
    targetStage: DealStage, 
    userId: string
  ): Promise<Deal> {

    const deal = await this.dealRepository.findOne({
      where: { id: dealId }
    });

    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    const validation = await this.processValidator.validateStageRequirements(deal, targetStage);
  if (!validation.isValid) {
    throw new BadRequestException(validation.errors.map(e => e.message).join(', '));
  }



    // Validate user has permission
    // if (!this.hasPermission(deal, userId, 'update_stage')) {
    //   throw new ForbiddenException('Not authorized to update deal stage');
    // }

    // Attempt stage transition
    try {
      const result = await this.stageManager.attemptStageTransition(deal, targetStage, userId);

      this.notifyParticipants(dealId, 'deal.stage_changed', {
        dealId,
        previousStage: deal.stage,
        stage: targetStage,
        status: deal.status
      }, userId);


      if (!result.success) {
        throw new BadRequestException(result.validationErrors?.join(', '));
      }

      deal.timeline.push(result.timeline);
      
      return await this.dealRepository.save(deal);

    } catch (error: any) {
      this.logger.error('Stage update failed', {
        dealId,
        targetStage,
        error: error.message
      });
      throw error;
    }
  }

  async validateStageTransition(
    dealId: string,
    targetStage: DealStage
  ): Promise<{
    canProgress: boolean;
    blockers: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId }
    });

    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    return await this.stageManager.getValidationSummary(deal);
  }

  async getStageRequirements(dealId: string): Promise<string[]> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId }
    });

    if (!deal) {
      throw new BadRequestException('Deal not found');
    }

    return await this.stageManager.getRemainingRequirements(deal);
  }


  

  async validateParticipantAddition(
    dealId: string,
    participantDto: AddParticipantDto
  ): Promise<ParticipantValidationResult> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const existingRoles = deal.participants.map(p => p.role);
    const missingRoles = this.getMissingRequiredRoles(existingRoles);
    const canAdd = !deal.participants.some(p =>
      p.userId === participantDto.userId && p.status === 'active'
    );

    return {
      canAdd,
      canRemove: deal.participants.length > 2,
      requiredRoles: this.getRequiredRoles(deal.type),
      currentRoles: existingRoles,
      missingRoles,
      validationErrors: canAdd ? [] : ['Participant already exists']
    };
  }

  async validateParticipantUpdate(
    dealId: string,
    participantId: string,
    updateDto: UpdateParticipantDto
  ): Promise<ParticipantValidationResult> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const participant = deal.participants.find(p => p.id === participantId);
    if (!participant) throw new NotFoundException('Participant not found');

    // Check if role change would remove a required role
    const otherRoles = deal.participants
      .filter(p => p.id !== participantId)
      .map(p => p.role);

    const wouldRemoveRequiredRole =
      this.isRequiredRole(participant.role) &&
      !otherRoles.includes(participant.role) &&
      updateDto.role !== participant.role;

    return {
      canAdd: false,
      canRemove: deal.participants.length > 2 && !wouldRemoveRequiredRole,
      requiredRoles: this.getRequiredRoles(deal.type),
      currentRoles: deal.participants.map(p => p.role),
      missingRoles: this.getMissingRequiredRoles(otherRoles),
      validationErrors: wouldRemoveRequiredRole ?
        ['Cannot remove last required role'] : []
    };
  }

  async validateParticipantRemoval(
    dealId: string,
    participantId: string
  ): Promise<ParticipantValidationResult> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const participant = deal.participants.find(p => p.id === participantId);
    if (!participant) throw new NotFoundException('Participant not found');

    const otherRoles = deal.participants
      .filter(p => p.id !== participantId)
      .map(p => p.role);

    const wouldRemoveRequiredRole =
      this.isRequiredRole(participant.role) &&
      !otherRoles.includes(participant.role);

    return {
      canAdd: false,
      canRemove: deal.participants.length > 2 && !wouldRemoveRequiredRole,
      requiredRoles: this.getRequiredRoles(deal.type),
      currentRoles: deal.participants.map(p => p.role),
      missingRoles: this.getMissingRequiredRoles(otherRoles),
      validationErrors: wouldRemoveRequiredRole ?
        ['Cannot remove required role'] : []
    };
  }

  private getRequiredRoles(dealType: string): ParticipantRole[] {
    switch (dealType) {
      case 'FULL_SALE':
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
      case 'LEASE':
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
      default:
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
    }
  }

  private isRequiredRole(role: ParticipantRole): boolean {
    return [ParticipantRole.SELLER, ParticipantRole.BUYER].includes(role);
  }

  private getMissingRequiredRoles(currentRoles: ParticipantRole[]): ParticipantRole[] {
    const required = new Set([ParticipantRole.SELLER, ParticipantRole.BUYER]);
    const current = new Set(currentRoles);
    return Array.from(required).filter(role => !current.has(role));
  }

  async updateDealStatus(
    id: string,
    targetStatus: DealStatus,
    userId: string,
    reason?: string
  ): Promise<Deal> {
    const deal = await this.findDealById(id, userId);

    // Validate user has permission
    if (!this.hasPermission(deal, userId, 'update_status')) {
      throw new ForbiddenException('Not authorized to update deal status');
    }

    // Attempt status transition
    const transitionResult = await this.statusManager.attemptStatusTransition(
      deal,
      targetStatus,
      userId,
      reason
    );

    if (!transitionResult.success) {
      throw new BadRequestException(
        transitionResult.validationErrors?.join(', ') || 'Status transition failed'
      );
    }

    // Update deal
    deal.status = transitionResult.newStatus;
    deal.timeline.push(transitionResult.timeline);

    const updatedDeal = await this.dealRepository.save(deal);

    // Notify participants
    this.notifyParticipants(id, 'deal.status_changed', {
      dealId: id,
      previousStatus: deal.status,
      newStatus: targetStatus,
      reason
    },
    userId);

    return updatedDeal;
  }

  // async validateDealStage(id: string, userId: string): Promise<ValidationResult> {
  //   const deal = await this.findDealById(id, userId);
  //   return await this.processValidator.validateDealProcess(deal);
  // }

  async getDealTimeline(
    id: string,
    userId: string,
    filter?: {
      type?: string;
      startDate?: Date;
      endDate?: Date;
      actor?: string;
    }
  ) {
    const deal = await this.findDealById(id, userId);

    let timeline = deal.timeline;

    if (filter) {
      if (filter.type) {
        timeline = this.timelineManager.getTimelineEntriesByType(deal, filter.type as TimelineEventType);
      }
      if (filter.actor) {
        timeline = this.timelineManager.getTimelineEntriesByActor(deal, filter.actor);
      }
      if (filter.startDate && filter.endDate) {
        timeline = this.timelineManager.getTimelineEntriesInDateRange(
          deal,
          filter.startDate,
          filter.endDate
        );
      }
    }

    const summary = await this.timelineManager.summarizeTimeline(deal);

    return {
      timeline,
      summary
    };
  }

  private notifyParticipants(dealId: string, event: string, data: any, userId: string) {
    this.eventsGateway.emitDealEvent({
          id: uuidv4(),
          type: DealEventType.DOCUMENT_APPROVED,
          dealId: dealId,
          timestamp: new Date(),
          actor: { id: userId },
          data: data,
          recipients: data.participants.map((p: { userId: string }) => p.userId)
        });
  }

  async findDealById(id: string, userId: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id },
      relations: ['horse', 'createdBy']
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Check if user is a participant
    // if (!this.isParticipant(deal, userId)) {
    //   throw new ForbiddenException('Not authorized to view this deal');
    // }

    return deal;
  }

  async findDeals(params: SearchParams) {
    try {
      const {
        type,
        stage,
        status,
        horseId,
        userId,
        searchQuery,
        page = 1,
        limit = 10
      } = params;

      const queryBuilder = this.dealRepository.createQueryBuilder('deal')
        .leftJoinAndSelect('deal.horse', 'horse');
      // .leftJoinAndSelect('deal.createdBy', 'createdBy');

      // Apply filters
      // if (type) {
      //   queryBuilder.andWhere('deal.type = :type', { type });
      // }

      // if (stage) {
      //   queryBuilder.andWhere('deal.stage = :stage', { stage });
      // }

      // if (status) {
      //   queryBuilder.andWhere('deal.status = :status', { status });
      // }

      // if (horseId) {
      //   queryBuilder.andWhere('deal.horseId = :horseId', { horseId });
      // }

      // if (userId) {
      //   queryBuilder.andWhere(
      //     `deal.participants @> :participant`,
      //     { participant: JSON.stringify([{ userId }]) }
      //   );
      // }

      // if (searchQuery) {
      //   queryBuilder.andWhere(
      //     '(horse.name ILIKE :search OR deal.notes ILIKE :search)',
      //     { search: `%${searchQuery}%` }
      //   );
      // }

      const [deals, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // this.logger.log('Found deals:', deals);

      return { deals, total };

    } catch (error) {
      this.logger.error('Error finding deals:', error);
      throw error;
    }
  }

  async updateDeal(id: string, updateDealDto: UpdateDealDto, userId: string): Promise<Deal> {
    const deal = await this.findDealById(id, userId);

    // Validate user has permission to update
    if (!this.hasPermission(deal, userId, 'update')) {
      throw new ForbiddenException('Not authorized to update this deal');
    }

    // Add timeline entry for stage/status changes
    if (updateDealDto.stage || updateDealDto.status) {
      deal.timeline.push({
        id: uuidv4(),
        type: TimelineEventType.STAGE_CHANGE,
        stage: updateDealDto.stage || deal.stage,
        status: updateDealDto.status || deal.status,
        date: new Date(),
        description: 'Deal updated',
        actor: userId
      });
    }

    // Update deal
    Object.assign(deal, updateDealDto);
    return await this.dealRepository.save(deal);
  }

  async addParticipant(
    dealId: string,
    addParticipantDto: AddParticipantDto,
    userId: string
  ): Promise<Deal> {
    this.logger.log('Controller: Participant recevied from frontend:', addParticipantDto);
    const deal = await this.findDealById(dealId, userId);

    // Validate user has permission to add participants
    // if (!this.hasPermission(deal, userId, 'manage_participants')) {
    //   throw new ForbiddenException('Not authorized to add participants');
    // }

    // Validate user exists
    const user = await this.userService.findOrCreateUser(addParticipantDto);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Add participant
    deal.participants.push({
      id: uuidv4(),
      userId: user.id,
      role: addParticipantDto.role,
      permissions: addParticipantDto.permissions,
      dateAdded: new Date(),
      status: 'active',
      metadata: addParticipantDto.metadata
    });


    // Add timeline entry
    await this.timelineManager.addParticipantEntry(
      deal,
      'ADDED',
      user.id,
      userId
    );

    return await this.dealRepository.save(deal);
  }

  async removeParticipant(
    dealId: string,
    participantId: string,
    reason: string,
    userId: string,
    force?: boolean
  ): Promise<Deal> {
    const deal = await this.findDealById(dealId, userId);
  
    // Validate user has permission
    if (!this.hasPermission(deal, userId, 'manage_participants')) {
      throw new ForbiddenException('Not authorized to remove participants');
    }
  
    // Find participant index
    const participantIndex = deal.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      throw new NotFoundException('Participant not found');
    }
  
    const participant = deal.participants[participantIndex];
  
    // Prevent removal of last required role unless forced
    if (!force) {
      const otherParticipants = deal.participants.filter(p => p.id !== participantId);
      const hasOtherWithRole = otherParticipants.some(p => p.role === participant.role);
      
      if (this.isRequiredRole(participant.role) && !hasOtherWithRole) {
        throw new BadRequestException('Cannot remove last participant with required role');
      }
    }
  
    // Remove participant
    deal.participants.splice(participantIndex, 1);
  
    // Add timeline entry
    await this.timelineManager.addParticipantEntry(
      deal,
      'REMOVED',
      participantId,
      userId,
      { reason }
    );
  
    const updatedDeal = await this.dealRepository.save(deal);
  
    // Notify participants
    this.notifyParticipants(dealId, 'participant.removed', {
      participantId,
      removedBy: userId,
      reason
    }, userId);
  
    return updatedDeal;
  }

  async updateParticipant(
    dealId: string,
    updateParticipantDto: UpdateParticipantDto,
    userId: string
  ): Promise<Deal> {
    const deal = await this.findDealById(dealId, userId);
  
    // Validate user has permission
    if (!this.hasPermission(deal, userId, 'manage_participants')) {
      throw new ForbiddenException('Not authorized to update participants');
    }
  
    // Update participant
    const participantIndex = deal.participants.findIndex(
      p => p.id === updateParticipantDto.participantId
    );
  
    if (participantIndex === -1) {
      throw new NotFoundException('Participant not found');
    }
  
    // Update the participant
    const participant = deal.participants[participantIndex];
    Object.assign(participant, updateParticipantDto);
    deal.participants[participantIndex] = participant;
  
    // Validate updated participants structure
    const validation = await this.processValidator.validateDealProcess(deal);
    if (!validation.isValid) {
      throw new BadRequestException(
        validation.errors.filter(e => e.field?.includes('participant')).map(e => e.message).join(', ')
      );
    }
  
    // Add timeline entry
    await this.timelineManager.addParticipantEntry(
      deal,
      'UPDATED',
      participant.id,
      userId
    );
  
    return await this.dealRepository.save(deal);
  }

  async updateParticipantStatus(
    dealId: string,
    participantId: string,
    status: 'active' | 'inactive',
    reason: string,
    userId: string
  ): Promise<Deal> {
    const deal = await this.findDealById(dealId, userId);
  
    // Validate user has permission
    if (!this.hasPermission(deal, userId, 'manage_participants')) {
      throw new ForbiddenException('Not authorized to update participant status');
    }
  
    const participant = deal.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
  
    // Check if status change would remove last required role
    if (status === 'inactive' && this.isRequiredRole(participant.role)) {
      const activeWithSameRole = deal.participants.filter(p => 
        p.id !== participantId && 
        p.role === participant.role &&
        p.status === 'active'
      );
  
      if (activeWithSameRole.length === 0) {
        throw new BadRequestException('Cannot deactivate last participant with required role');
      }
    }
  
    // Update status and add status history
    const previousStatus = participant.status;
    participant.status = status;
    participant.metadata = {
      ...participant.metadata,
      statusHistory: [
        ...(participant.metadata?.statusHistory || []),
        {
          from: previousStatus,
          to: status,
          date: new Date().toISOString(),
          reason,
          updatedBy: userId
        }
      ]
    };
  
    // Add timeline entry
    await this.timelineManager.addParticipantEntry(
      deal,
      'UPDATED',
      participantId,
      userId,
      {
        previousStatus: previousStatus === 'active' ? DealStatus.ACTIVE : DealStatus.INACTIVE,
        newStatus: status === 'active' ? DealStatus.ACTIVE : DealStatus.INACTIVE,
        reason,
        automatic: false
      }
    );
  
    const updatedDeal = await this.dealRepository.save(deal);
  
    // Notify participants
    this.notifyParticipants(dealId, 'participant.status_changed', {
      participantId,
      previousStatus,
      newStatus: status,
      reason,
      updatedBy: userId
    }, userId);
  
    return updatedDeal;
  }
  
  private getParticipantStatusSummary(deal: Deal): {
    activeCount: number;
    inactiveCount: number;
    requiredRolesFilled: boolean;
    missingRoles: ParticipantRole[];
  } {
    const active = deal.participants.filter(p => p.status === 'active');
    const activeRoles = new Set(active.map(p => p.role));
    const requiredRoles = this.getRequiredRoles(deal.type);
    const missingRoles = requiredRoles.filter(role => !activeRoles.has(role));
  
    return {
      activeCount: active.length,
      inactiveCount: deal.participants.length - active.length,
      requiredRolesFilled: missingRoles.length === 0,
      missingRoles
    };
  }

  private isParticipant(deal: Deal, userId: string): boolean {
    return deal.participants.some(p => p.userId === userId && p.status === 'active');
  }

  private hasPermission(deal: Deal, userId: string, permission: string): boolean {
    const participant = deal.participants.find(
      p => p.userId === userId && p.status === 'active'
    );

    if (!participant) {
      return false;
    }

    // Creator and certain roles have all permissions
    if (
      deal.createdById === userId ||
      [ParticipantRole.SELLER, ParticipantRole.BUYER].includes(participant.role)
    ) {
      return true;
    }

    return participant.permissions.includes(permission);
  }

  async validateDeal(
    id: string, 
    userId: string,
    targetStage?: DealStage,
    detailed?: boolean,
    specificChecks?: string[]
  ): Promise<ValidationResult> {
    const deal = await this.findDealById(id, userId);
    
    // Use ProcessValidator for validation
    const validation = await this.processValidator.validateDealProcess(deal);
    
    if (targetStage) {
      const stageValidation = await this.processValidator.validateStageRequirements(deal, targetStage);
      return {
        ...validation,
        errors: [...validation.errors, ...stageValidation.errors],
        missingRequirements: [...validation.missingRequirements, ...stageValidation.missingRequirements],
        suggestions: [...validation.suggestions, ...stageValidation.suggestions]
      };
    }
  
    return validation;
  }
  
  
  // async getStageRequirements(
  //   id: string,
  //   stage: DealStage,
  //   includeValidation?: boolean
  // ): Promise<StageRequirementsResponse> {
  //   const deal = await this.dealRepository.findOne({ where: { id } });
  //   if (!deal) throw new NotFoundException('Deal not found');
  
  //   const requirements = this.stageManager.getRequirementsForStage(stage);
    
  //   if (includeValidation) {
  //     const validation = await this.processValidator.validateDealProcess({
  //       ...deal,
  //       stage
  //     });
      
  //     return {
  //       stage,
  //       requirements: {
  //         documents: [],
  //         participants: [],
  //         conditions: [],
  //         ...requirements
  //       },
  //       // validation,
  //       // missingRequirements: this.getMissingRequirements(deal, stage)
  //     };
  //   }
    
  //   return { 
  //     stage, 
  //     requirements: {
  //       documents: [],
  //       participants: [],
  //       conditions: [],
  //       ...requirements
  //     } 
  //   };
  // }
  
  
  private calculateTimeInStage(deal: Deal): number {
    const stageEntry = [...deal.timeline]
      .reverse()
      .find(entry => 
        entry.type === TimelineEventType.STAGE_CHANGE && 
        entry.metadata?.newStage === deal.stage
      );
    
    return stageEntry 
      ? Date.now() - new Date(stageEntry.date).getTime()
      : 0;
  }

}