import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Req, ParseUUIDPipe, BadRequestException,
  ValidationPipe, UsePipes, Logger, NotFoundException,
  ForbiddenException, ConflictException,
  Res
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealService, DocumentDownloadService } from './deal.service';
import {
  CreateDealDto, UpdateDealDto, StageTransitionDto, StatusUpdateDto,
  ValidationRequestDto, AddParticipantDto, UpdateParticipantDto,
  RemoveParticipantDto, StageRequirementsDto
} from './dto/deal.dto';
import { FastifyFiles, ProcessedFile, FastifyRequest } from '../../shared/fastify-files.interceptor';
import { FileLogger } from '../../utils/logger';
import { DealStageGuard } from './guards/deal-stage.guard';
// import { DealParticipantGuard } from './guards/deal-participant.guard';
import { Deal, DealStage, DealStatus, ParticipantRole } from './entities/deal.entity';
import { TimelineEventType } from './interfaces/timeline.interface';
import { v4 as uuidv4 } from 'uuid';
import { ProcessValidator } from './services/process-validator.service';
import { DealStageManager } from './services/deal-stage-manager.service';
import { CommentService } from './services/comment.service';
import { AddCommentDto, CommentType, UpdateCommentDto } from './interfaces/comments.interface';
import { FileService } from '../shared/services/file.service';
import { FastifyReply } from 'fastify';
// import { CurrentUser } from '../../auth/decorators/current-user.decorator';


interface RequestWithUser extends FastifyRequest {
  user: { id: string };
  processedFields?: Record<string, string>;
  processedFiles?: ProcessedFile[];
  stageValidation?: any;
}

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealController {
  private logger = FileLogger.getInstance();

  constructor(
    private readonly dealService: DealService,
    private readonly processValidator: ProcessValidator,
    private readonly stageManager: DealStageManager,
    private readonly commentService: CommentService,
    private readonly documentDownloadService: DocumentDownloadService,
    private readonly fileService: FileService
  ) { }

  // Create Deal
  @Post()
  @FastifyFiles(
    [{ name: 'documentFiles', maxCount: 20 }],
    {
      maxFileSize: 15 * 1024 * 1024,
      maxFiles: 20,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ]
    }
  )
  async createDeal(@Req() req: RequestWithUser) {
    const logger = FileLogger.getInstance();

    try {
      const fields = req.processedFields || {};
      const files = req.processedFiles || [];

      const processedData = this.processFormData(fields, files);

      const finalData = {
        type: processedData.basicInfo.type,
        horseId: processedData.basicInfo.horseId,
        ...processedData,
        createdBy: { id: req.user.id },
        status: DealStatus.ACTIVE,
        stage: DealStage.INITIATION
      };

      return await this.dealService.createDeal(finalData, req.user.id);

    } catch (error) {
      logger.error('Error creating deal:', error);
      throw error;
    }
  }

  // Participant Management
  @Post(':id/participants')
  @UsePipes(new ValidationPipe())
  async addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addParticipantDto: AddParticipantDto,
    @Req() req: RequestWithUser
  ) {
    try {
      this.logger.log('Controller: Participant recevied from frontend:', addParticipantDto);
      return await this.dealService.addParticipant(
        id,
        addParticipantDto,
        req.user.id
      );
    } catch (error) {
      this.logger.error('Error adding participant:', error);
      throw error;
    }
  }

  @Put(':id/participants/:participantId')
  @UsePipes(new ValidationPipe())
  async updateParticipant(
    @Param('id', ParseUUIDPipe) dealId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
    @Req() req: RequestWithUser
  ) {
    try {
      return await this.dealService.updateParticipant(
        dealId,
        updateParticipantDto,
        req.user.id
      );
    } catch (error) {
      this.logger.error('Error updating participant:', error);
      throw error;
    }
  }

  @Delete(':id/participants/:participantId')
  @UsePipes(new ValidationPipe())
  async removeParticipant(
    @Param('id', ParseUUIDPipe) dealId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() removeParticipantDto: RemoveParticipantDto,
    @Req() req: RequestWithUser
  ) {
    try {
      // Validate participant can be removed
      const validationResult = await this.dealService.validateParticipantRemoval(
        dealId,
        participantId
      );

      if (!validationResult.canRemove && !removeParticipantDto.force) {
        throw new BadRequestException(validationResult.validationErrors.join(', '));
      }

      return await this.dealService.removeParticipant(
        dealId,
        participantId,
        removeParticipantDto.reason,
        req.user.id,
        removeParticipantDto.force
      );
    } catch (error) {
      this.logger.error('Error removing participant:', error);
      throw error;
    }
  }

  // Stage & Status Management
  @Post(':id/stage')
  @UsePipes(new ValidationPipe())
  @UseGuards(DealStageGuard)
  async updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stageTransitionDto: StageTransitionDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log('Controller: Stage transition request:', stageTransitionDto);
    try {
      const deal = await this.dealService.updateStage(
        id,
        stageTransitionDto.targetStage,
        req.user.id
      );

      return {
        success: true,
        deal,
        message: `Deal stage updated to ${stageTransitionDto.targetStage}`
      };
    } catch (error: any) {
      this.logger.error('Error updating stage:', error);
      throw new BadRequestException(error.message);
    }
  }


  @Post(':id/status')
  @UsePipes(new ValidationPipe())
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusUpdateDto: StatusUpdateDto,
    @Req() req: RequestWithUser
  ) {
    try {
      return await this.dealService.updateDealStatus(
        id,
        statusUpdateDto.status,
        req.user.id,
        statusUpdateDto.reason
      );
    } catch (error) {
      this.logger.error('Error updating status:', error);
      throw error;
    }
  }

  @Get(':id/validate')
@UsePipes(new ValidationPipe())
async validateDeal(
  @Param('id', ParseUUIDPipe) id: string,
  @Query() validationDto: ValidationRequestDto,
  @Req() req: RequestWithUser
) {
  return this.dealService.validateDeal(
    id,
    req.user.id,
    validationDto.targetStage,
    validationDto.detailed,
    validationDto.specificChecks
  );
}

@Get(':id/stage/requirements')
async getStageRequirements(@Param('id') id: string) {
  return await this.dealService.getStageRequirements(id);
}

@Post(':id/stage/validate')
  async validateStageTransition(
    @Param('id') id: string,
    @Body('targetStage') targetStage: DealStage
  ) {
    return await this.dealService.validateStageTransition(id, targetStage);
  }

  private calculateTimeInStage(deal: Deal): number {
    const stageEntry = deal.timeline
      .reverse()
      .find(entry =>
        entry.type === TimelineEventType.STAGE_CHANGE &&
        entry.metadata?.newStage === deal.stage
      );

    if (!stageEntry) return 0;
    return Date.now() - new Date(stageEntry.date).getTime();
  }

  @Get(':id/documents/:documentId/download')
async downloadDocument(
  @Param('id', ParseUUIDPipe) dealId: string,
  @Param('documentId', ParseUUIDPipe) documentId: string,
  @Query('token') token: string,
  @Res() reply: FastifyReply
) {
  try {
    const document = await this.documentDownloadService.downloadDocument(dealId, documentId);
    if (!document) throw new NotFoundException('Document not found');

    if (!document.url) {
      throw new NotFoundException('Document URL not found');
    }
    const file = await this.fileService.getFile(document.url);
    
    reply.header('Content-Type', document.metadata?.mimeType || 'application/pdf')
    reply.header('Content-Disposition', 'inline')
    reply.header('X-Frame-Options', 'SAMEORIGIN')
    reply.header('Content-Disposition', `attachment; filename="${document.metadata?.name}"`);
    
    return reply.send(file);
  } catch (error) {
    this.logger.error('Error downloading document:', error);
    throw error;
  }
}

@Get(':id/documents/:documentId/preview')
async previewDocument(
  @Param('id', ParseUUIDPipe) dealId: string,
  @Param('documentId', ParseUUIDPipe) documentId: string,
  @Query('token') token: string,
  @Res() reply: FastifyReply
) {
  try {
    const document = await this.documentDownloadService.getDocument(dealId, documentId);
    if (!document) throw new NotFoundException('Document not found');

    if (!document.url) {
      throw new NotFoundException('Document URL not found');
    }
    const file = await this.fileService.getFile(document.url);
    
    reply.header('Content-Type', document.metadata?.mimeType || 'application/pdf')
    reply.header('Content-Disposition', 'inline')
    reply.header('X-Frame-Options', 'SAMEORIGIN')
    reply.header('Content-Disposition', `attachment; filename="${document.name}"`);
    
    return reply.send(file);
  } catch (error) {
    this.logger.error('Error previewing document:', error);
    throw error;
  }
}

  @Post(':id/documents/:documentId/approve')
  @UsePipes(new ValidationPipe())
  async approveDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: RequestWithUser
  ) {
    try {
      return await this.dealService.approveDocument(
        id,
        documentId,
        req.user.id
      );
    } catch (error) {
      this.logger.error('Error approving document:', error);
      throw error;
    }
  }

  @Post(':id/documents/:documentId/reject')
  @UsePipes(new ValidationPipe())
  async rejectDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body('reason') reason: string,
    @Req() req: RequestWithUser
  ) {
    try {
      return await this.dealService.rejectDocument(
        id,
        documentId,
        req.user.id,
        reason
      );
    } catch (error) {
      this.logger.error('Error rejecting document:', error);
      throw error;
    }
  }

  // Standard CRUD & Search
  @Get()
  @UsePipes(new ValidationPipe())
  async findDeals(
    @Req() req: RequestWithUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('stage') stage?: DealStage,
    @Query('status') status?: DealStatus,
    @Query('searchQuery') searchQuery?: string
  ) {
    try {
      return await this.dealService.findDeals({
        page,
        limit,
        type,
        stage,
        status,
        searchQuery,
        userId: req.user.id
      });
    } catch (error) {
      this.logger.error('Error finding deals:', error);
      throw error;
    }
  }

  @Get(':id')
  @UsePipes(new ValidationPipe())
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const deal = await this.dealService.findDealById(id, req.user.id);
      if (!deal) {
        throw new NotFoundException('Deal not found');
      }
      return deal;
    } catch (error) {
      this.logger.error('Error finding deal:', error);
      throw error;
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  @FastifyFiles(
    [{ name: 'documentFiles', maxCount: 20 }],
    {
      maxFileSize: 15 * 1024 * 1024,
      maxFiles: 20,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ]
    }
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ) {
    try {
      const fields = req.processedFields || {};
      const files = req.processedFiles || [];

      const processedData = this.processFormData(fields, files);
      return await this.dealService.updateDeal(id, processedData, req.user.id);
    } catch (error) {
      this.logger.error('Error updating deal:', error);
      throw error;
    }
  }

  // Timeline & Activity
  @Get(':id/timeline')
  async getTimeline(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('type') type?: TimelineEventType
  ) {
    try {
      return await this.dealService.getDealTimeline(id, req.user.id, {
        type,
        startDate,
        endDate,
        actor: req.user.id
      });
    } catch (error) {
      this.logger.error('Error getting timeline:', error);
      throw error;
    }
  }

  // @Post(':id/comments')
  // @UsePipes(new ValidationPipe())
  // async addComment(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body('content') content: string,
  //   @Req() req: RequestWithUser
  // ) {
  //   try {
  //     return await this.dealService.addComment(id, content, req.user.id);
  //   } catch (error) {
  //     this.logger.error('Error adding comment:', error);
  //     throw error;
  //   }
  // }

  // Helper methods
  private processFormData(fields: Record<string, any>, files: ProcessedFile[]) {
    const basicInfo = JSON.parse(this.extractFieldValue(fields.basicInfo));
    const participants = JSON.parse(this.extractFieldValue(fields.participants));
    const terms = JSON.parse(this.extractFieldValue(fields.terms));
    const logistics = fields.logistics ? JSON.parse(this.extractFieldValue(fields.logistics)) : undefined;
    const documentMetadata = JSON.parse(this.extractFieldValue(fields.documents));

    // Process document files
    const documentFiles = files.filter(file => file.fieldname === 'documentFiles');
    const processedDocuments = documentMetadata.map((doc: any, index: number) => ({
      ...doc,
      buffer: documentFiles[index]?.buffer,
      originalname: documentFiles[index]?.originalname,
      mimetype: documentFiles[index]?.mimetype
    }));

    // Initialize or update timeline
    const timeline = [{
      id: uuidv4(),
      type: TimelineEventType.STAGE_CHANGE,
      stage: DealStage.INITIATION,
      status: DealStatus.ACTIVE,
      date: new Date(), // Changed from ISO string to Date object
      description: 'Deal created',
      actor: 'system',
      metadata: { automatic: true }
    }];

    return {
      basicInfo,
      participants,
      terms,
      logistics,
      documents: processedDocuments,
      timeline
    };
  }

  private extractFieldValue(field: any): any {
    if (!field) return null;

    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }

    if (field.value && typeof field === 'object') {
      return field.value;
    }

    const match = field.toString().match(/Field\([^)]+\): (.*)/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (error: any) {
        throw new BadRequestException(`Invalid JSON in field: ${error.message}`);
      }
    }

    return field;
  }

  @Post(':id/comments')
@UsePipes(new ValidationPipe())
async addComment(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() commentDto: AddCommentDto,
  @Req() req: RequestWithUser
) {
  try {
    return await this.commentService.addComment(id, req.user.id, commentDto);
  } catch (error) {
    this.logger.error('Error adding comment:', error);
    throw error;
  }
}

@Put(':id/comments/:commentId')
@UsePipes(new ValidationPipe())
async updateComment(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('commentId', ParseUUIDPipe) commentId: string,
  @Body() updateDto: UpdateCommentDto,
  @Req() req: RequestWithUser
) {
  try {
    return await this.commentService.updateComment(id, commentId, req.user.id, updateDto);
  } catch (error) {
    this.logger.error('Error updating comment:', error);
    throw error;
  }
}

@Delete(':id/comments/:commentId')
async deleteComment(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('commentId', ParseUUIDPipe) commentId: string,
  @Req() req: RequestWithUser
) {
  try {
    await this.commentService.deleteComment(id, commentId, req.user.id);
  } catch (error) {
    this.logger.error('Error deleting comment:', error);
    throw error;
  }
}

@Get(':id/comments')
async getComments(
  @Param('id', ParseUUIDPipe) id: string,
  @Query('type') type?: CommentType,
  @Query('parentId') parentId?: string,
  @Query('since') since?: Date
) {
  try {
    return await this.commentService.getComments(id, { type, parentId, since });
  } catch (error) {
    this.logger.error('Error getting comments:', error);
    throw error;
  }
}

}