import { 
    Injectable, 
    CanActivate, 
    ExecutionContext, 
    ForbiddenException,
    BadRequestException
  } from '@nestjs/common';
  import { DealStage, Deal, ParticipantRole } from '../entities/deal.entity';
  import { DealService } from '../deal.service';
  import { DealStageManager } from '../services/deal-stage-manager.service';
  import { ProcessValidator } from '../services/process-validator.service';
  import { FileLogger } from '../../../utils/logger';
  
  @Injectable()
  export class DealStageGuard implements CanActivate {
    private logger = FileLogger.getInstance();
  
    constructor(
      private readonly dealService: DealService,
      private readonly stageManager: DealStageManager,
      private readonly processValidator: ProcessValidator
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const userId = request.user.id;
      const dealId = request.params.id;
      const targetStage: DealStage = request.body.stage;
  
      try {
        this.logger.log('Validating stage transition', {
          dealId,
          userId,
          targetStage
        });
  
        // Validate deal exists and user has access
        const deal = await this.dealService.findDealById(dealId, userId);
  
        // Validate user has required permissions
        // if (!this.hasRequiredPermissions(deal, userId)) {
        //   throw new ForbiddenException('Insufficient permissions for stage transition');
        // }
  
        // Validate stage transition is allowed
        const transitionValidation = await this.validateStageTransition(
          deal,
          targetStage,
          userId
        );
  
        this.logger.log('Stage transition validation result', transitionValidation);
  
        if (!transitionValidation.allowed) {
          throw new BadRequestException(transitionValidation.reason);
        }
  
        // Add validation results to request for use in controller
        request.stageValidation = transitionValidation;
  
        this.logger.log('Stage transition validation successful');
  
        return true;
  
      } catch (error) {
        this.logger.error('Stage transition validation failed', error);
        throw error;
      }
    }
  
    private async validateStageTransition(
      deal: Deal,
      targetStage: DealStage,
      userId: string
    ): Promise<{
      allowed: boolean;
      reason?: string;
      validationResult?: any;
    }> {
      this.logger.log('Validating stage transition', {
        dealId: deal.id,
        currentStage: deal.stage,
        targetStage,
        userId
      });
      // Preliminary stage validation
      const transitionResult = await this.stageManager.attemptStageTransition(
        deal,
        targetStage,
        userId
      );
      this.logger.log('Stage transition result', transitionResult);
  
      if (!transitionResult.success) {
        return {
          allowed: false,
          reason: transitionResult.validationErrors?.join(', ') || 'Invalid stage transition'
        };
      }
  
      // Process validation for target stage
      deal.stage = targetStage;
      const processValidation = await this.processValidator.validateDealProcess(deal);

      this.logger.log('Process validation result', processValidation);
  
      if (!processValidation.isValid) {
        return {
          allowed: false,
          reason: 'Process requirements not met: ' + 
            processValidation.errors.map(e => e.message).join(', '),
          validationResult: processValidation
        };
      }
  
      return {
        allowed: true,
        validationResult: processValidation
      };
    }
  
    private hasRequiredPermissions(deal: Deal, userId: string): boolean {
      // Check if user is a participant
      const participant = deal.participants.find(p => 
        p.userId === userId && p.status === 'active'
      );
  
      if (!participant) {
        return false;
      }
  
      // Deal creator and certain roles always have permission
      if (
        deal.createdById === userId ||
        ['seller', 'buyer'].includes(participant.role)
      ) {
        return true;
      }
  
      // Check specific permissions
      return participant.permissions.includes('update_stage');
    }
  
    private getRequiredPermissionsForStage(stage: DealStage): string[] {
      switch (stage) {
        case DealStage.INITIATION:
          return ['create_deal'];
        case DealStage.DISCUSSION:
          return ['update_stage', 'update_terms'];
        case DealStage.EVALUATION:
          return ['update_stage', 'schedule_inspection'];
        case DealStage.DOCUMENTATION:
          return ['update_stage', 'manage_documents'];
        case DealStage.CLOSING:
          return ['update_stage', 'manage_documents', 'approve_completion'];
        case DealStage.COMPLETE:
          return ['update_stage', 'approve_completion'];
        default:
          return ['update_stage'];
      }
    }
  
    private getCustomValidationsForStage(stage: DealStage): ((deal: Deal) => boolean)[] {
      const validations: Record<DealStage, ((deal: Deal) => boolean)[]> = {
        [DealStage.INITIATION]: [
          (deal) => !!deal.horseId,
          (deal) => deal.participants.length >= 2,
          (deal) => deal.participants.some(p => p.role === ParticipantRole.SELLER),
          (deal) => deal.participants.some(p => p.role === ParticipantRole.BUYER || ParticipantRole.AGENT)
        ],
        [DealStage.DISCUSSION]: [
          (deal) => !!deal.terms?.price,
          (deal) => Array.isArray(deal.terms?.conditions) && deal.terms.conditions.length > 0
        ],
        [DealStage.EVALUATION]: [
          (deal) => !!deal.logistics?.inspection?.date,
          (deal) => !!deal.logistics?.inspection?.inspector
        ],
        [DealStage.DOCUMENTATION]: [
          (deal) => deal.documents.some(doc => 
            doc.type === 'contract' && doc.status === 'approved'
          ),
          (deal) => !!deal.logistics?.insurance
        ],
        [DealStage.CLOSING]: [
          (deal) => deal.documents.some(doc => 
            doc.type === 'signed_contract' && doc.status === 'approved'
          ),
          (deal) => !!deal.logistics?.transportation?.date
        ],
        [DealStage.COMPLETE]: [
          (deal) => deal.documents.some(doc => 
            doc.type === 'transfer_of_ownership' && doc.status === 'approved'
          ),
          (deal) => deal.documents.some(doc => 
            doc.type === 'payment_confirmation' && doc.status === 'approved'
          )
        ]
      };
  
      return validations[stage] || [];
    }
  }