import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { DealStage, DealStatus, DealType, ParticipantRole } from '../entities/deal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deal } from '../entities/deal.entity';
import { Horse } from '../../horses/entities/horse.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FileLogger } from '../../../utils/logger';
import { PriorityQueue } from '@datastructures-js/priority-queue';

interface ValidationError {
  code: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}


@Injectable()
export class DealValidationPipe implements PipeTransform {

  private validationQueue: PriorityQueue<ValidationError>;

  private logger = FileLogger.getInstance();

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { 
    this.validationQueue = new PriorityQueue<ValidationError>((a, b) => 
      a.severity === 'error' ? -1 : 1
    );
  }



  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) throw new BadRequestException('No data provided');

    try {
      switch (metadata.data) {
        case 'createDealDto':
          await this.validateCreateDeal(value);
          break;
        case 'updateDealDto':
          await this.validateUpdateDeal(value);
          break;
        case 'stage':
          this.validateStageTransition(value);
          break;
        case 'status':
          this.validateStatusTransition(value);
          break;
      }

      // Process validation queue
      const errors = this.processValidationQueue();
      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors
        });
      }

      return value;
    } catch (error) {
      this.logger.error('Validation error:', error);
      throw error instanceof BadRequestException ? error : 
        new BadRequestException('Validation failed');
    }
  }

  private processValidationQueue(): ValidationError[] {
    const errors: ValidationError[] = [];
    while (!this.validationQueue.isEmpty()) {
      errors.push(this.validationQueue.dequeue());
    }
    return errors;
  }

  private addValidationError(error: ValidationError) {
    this.validationQueue.enqueue(error);
  }

  private validateStageTransition(stage: DealStage) {
    const validStages = Object.values(DealStage);
    if (!validStages.includes(stage)) {
      this.addValidationError({
        code: 'INVALID_STAGE',
        message: `Invalid stage: ${stage}`,
        severity: 'error'
      });
    }
  }

  private validateStatusTransition(status: DealStatus) {
    const validStatuses = Object.values(DealStatus);
    if (!validStatuses.includes(status)) {
      this.addValidationError({
        code: 'INVALID_STATUS',
        message: `Invalid status: ${status}`,
        severity: 'error'
      });
    }
  }

  private async validateParticipants(participants: any[]) {
    if (!Array.isArray(participants)) {
      this.addValidationError({
        code: 'INVALID_PARTICIPANTS',
        message: 'Participants must be an array',
        severity: 'error'
      });
      return;
    }

    const userIds = participants.map(p => p.userId);
    const users = await this.userRepository.find({
      where: { id: In(userIds) }
    });

    if (users.length !== userIds.length) {
      const foundIds = new Set(users.map(u => u.id));
      const missingIds = userIds.filter(id => !foundIds.has(id));
      
      this.addValidationError({
        code: 'INVALID_USERS',
        message: `Users not found: ${missingIds.join(', ')}`,
        severity: 'error'
      });
    }

    participants.forEach(participant => {
      if (!Object.values(ParticipantRole).includes(participant.role)) {
        this.addValidationError({
          code: 'INVALID_ROLE',
          field: 'role',
          message: `Invalid role: ${participant.role}`,
          severity: 'error'
        });
      }

      if (!Array.isArray(participant.permissions)) {
        this.addValidationError({
          code: 'INVALID_PERMISSIONS',
          field: 'permissions',
          message: 'Permissions must be an array',
          severity: 'error'
        });
      }
    });
  }

  private validateTerms(terms: any, dealType: DealType) {
    switch (dealType) {
      case DealType.FULL_SALE:
        this.validateSaleTerms(terms);
        break;
      case DealType.LEASE:
        this.validateLeaseTerms(terms);
        break;
      case DealType.BREEDING:
        this.validateBreedingTerms(terms);
        break;
    }
  }

  private validateRequiredFields(obj: any, fields: string[], context: string) {
    fields.forEach(field => {
      if (!obj[field]) {
        this.addValidationError({
          code: 'MISSING_FIELD',
          field,
          message: `${context} must include ${field}`,
          severity: 'error'
        });
      }
    });
  }

  private isValidDate(date: any): boolean {
    const timestamp = Date.parse(date);
    return !isNaN(timestamp);
}

  private async validateCreateDeal(value: any) {
    // Validate horse exists and is available
    const horse = await this.horseRepository.findOne({
      where: { id: value.horseId }
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    // Check if horse is already in an active deal
    const existingDeal = await this.dealRepository.findOne({
      where: {
        horseId: value.horseId,
        status: DealStatus.ACTIVE
      }
    });

    if (existingDeal) {
      throw new BadRequestException('Horse is already in an active deal');
    }

    // Validate deal type and required fields
    switch (value.type) {
      case DealType.FULL_SALE:
        this.validateSaleDeal(value);
        break;
      case DealType.LEASE:
        this.validateLeaseDeal(value);
        break;
      case DealType.PARTNERSHIP:
        this.validatePartnershipDeal(value);
        break;
      case DealType.BREEDING:
        this.validateBreedingDeal(value);
        break;
      case DealType.TRAINING:
        this.validateTrainingDeal(value);
        break;
      default:
        throw new BadRequestException('Invalid deal type');
    }

    // Validate participants
    await this.validateParticipants(value.participants);
  }

  private async validateUpdateDeal(value: any) {
    if (value.stage) {
      this.validateStageTransition(value.stage);
    }

    if (value.status) {
      this.validateStatusTransition(value.status);
    }

    if (value.participants) {
      await this.validateParticipants(value.participants);
    }

    if (value.terms) {
      this.validateTerms(value.terms, value);
    }

    if (value.logistics) {
      this.validateLogistics(value.logistics);
    }
  }

  private async validateAddParticipant(value: any) {
    const user = await this.userRepository.findOne({
      where: { id: value.participant.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!Object.values(ParticipantRole).includes(value.participant.role)) {
      throw new BadRequestException('Invalid participant role');
    }

    if (!Array.isArray(value.participant.permissions)) {
      throw new BadRequestException('Permissions must be an array');
    }
  }

  private validateSaleDeal(value: any) {
    if (!value.terms?.price) {
      throw new BadRequestException('Sale deal must include price');
    }
  }

  private validateLeaseDeal(value: any) {
    if (!value.terms?.duration || !value.terms?.startDate) {
      throw new BadRequestException('Lease deal must include duration and start date');
    }
  }

  private validatePartnershipDeal(value: any) {
    if (!value.terms?.conditions || value.terms.conditions.length === 0) {
      throw new BadRequestException('Partnership deal must include conditions');
    }
  }

  private validateBreedingDeal(value: any) {
    if (!value.terms?.startDate || !value.terms?.conditions) {
      throw new BadRequestException('Breeding deal must include start date and conditions');
    }
  }

  private validateTrainingDeal(value: any) {
    if (!value.terms?.duration || !value.terms?.startDate) {
      throw new BadRequestException('Training deal must include duration and start date');
    }
  }

  private validateLogistics(logistics: any) {
    if (logistics.transportation) {
      this.validateTransportation(logistics.transportation);
    }

    if (logistics.inspection) {
      this.validateInspection(logistics.inspection);
    }

    if (logistics.insurance) {
      this.validateInsurance(logistics.insurance);
    }
  }

  private validateTransportation(transportation: any) {
    const requiredFields = ['pickupLocation', 'deliveryLocation', 'date'];
    this.validateRequiredFields(transportation, requiredFields, 'Transportation');

    if (!this.isValidDate(transportation.date)) {
      throw new BadRequestException('Invalid transportation date');
    }
  }

  private validateInspection(inspection: any) {
    const requiredFields = ['date', 'location', 'inspector'];
    this.validateRequiredFields(inspection, requiredFields, 'Inspection');

    if (!this.isValidDate(inspection.date)) {
      throw new BadRequestException('Invalid inspection date');
    }
  }

  private validateInsurance(insurance: any) {
    const requiredFields = ['provider', 'coverage', 'policyNumber', 'startDate', 'endDate'];
    this.validateRequiredFields(insurance, requiredFields, 'Insurance');

    if (!this.isValidDate(insurance.startDate)) {
      throw new BadRequestException('Invalid insurance start date');
    }

    if (!this.isValidDate(insurance.endDate)) {
      throw new BadRequestException('Invalid insurance end date');
    }
  }

  private validateSaleTerms(terms: any) {
    if (!terms.price || typeof terms.price !== 'number' || terms.price <= 0) {
      this.addValidationError({
        code: 'INVALID_PRICE',
        field: 'price',
        message: 'Sale price must be a positive number',
        severity: 'error'
      });
    }
  
    if (!terms.conditions || !Array.isArray(terms.conditions) || terms.conditions.length === 0) {
      this.addValidationError({
        code: 'MISSING_CONDITIONS',
        field: 'conditions',
        message: 'Sale terms must include conditions',
        severity: 'error'
      });
    }
  
    if (terms.currency && typeof terms.currency !== 'string') {
      this.addValidationError({
        code: 'INVALID_CURRENCY',
        field: 'currency',
        message: 'Currency must be a valid string',
        severity: 'error'
      });
    }
  }
  
  private validateLeaseTerms(terms: any) {
    if (!terms.duration || typeof terms.duration !== 'number' || terms.duration <= 0) {
      this.addValidationError({
        code: 'INVALID_DURATION',
        field: 'duration',
        message: 'Lease duration must be a positive number',
        severity: 'error'
      });
    }
  
    if (!terms.startDate || !this.isValidDate(terms.startDate)) {
      this.addValidationError({
        code: 'INVALID_START_DATE',
        field: 'startDate',
        message: 'Valid start date is required',
        severity: 'error'
      });
    }
  
    if (!terms.endDate || !this.isValidDate(terms.endDate)) {
      this.addValidationError({
        code: 'INVALID_END_DATE',
        field: 'endDate',
        message: 'Valid end date is required',
        severity: 'error'
      });
    }
  
    if (terms.startDate && terms.endDate && 
        new Date(terms.startDate) >= new Date(terms.endDate)) {
      this.addValidationError({
        code: 'INVALID_DATE_RANGE',
        field: 'dateRange',
        message: 'End date must be after start date',
        severity: 'error'
      });
    }
  }
  
  private validateBreedingTerms(terms: any) {
    if (!terms.startDate || !this.isValidDate(terms.startDate)) {
      this.addValidationError({
        code: 'INVALID_START_DATE',
        field: 'startDate', 
        message: 'Valid start date is required',
        severity: 'error'
      });
    }
  
    if (!terms.conditions || !Array.isArray(terms.conditions) || terms.conditions.length === 0) {
      this.addValidationError({
        code: 'MISSING_CONDITIONS',
        field: 'conditions',
        message: 'Breeding terms must include conditions',
        severity: 'error'
      });
    }
  
    // Validate breeding-specific conditions
    const requiredConditions = ['health_requirements', 'breeding_facility', 'live_foal_guarantee'];
    const missingConditions = requiredConditions.filter(
      condition => !terms.conditions.some((c: string) => 
        c.toLowerCase().includes(condition.replace('_', ' '))
      )
    );
  
    if (missingConditions.length > 0) {
      this.addValidationError({
        code: 'MISSING_BREEDING_CONDITIONS',
        field: 'conditions',
        message: `Missing required breeding conditions: ${missingConditions.join(', ')}`,
        severity: 'warning'
      });
    }
  }
}