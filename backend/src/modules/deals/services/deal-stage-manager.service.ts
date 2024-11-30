import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileLogger } from '../../../utils/logger';
import { ProcessValidator } from './process-validator.service';
import { DealEventsEmitter } from './deal-events-emitter.service';
import { Deal, DealStage, DealStatus } from '../entities/deal.entity';
import { TimelineEntry, TimelineEventType } from '../interfaces/timeline.interface';
import { NotificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

interface StageTransitionResult {
  success: boolean;
  newStage?: DealStage;
  timeline: TimelineEntry;
  validationErrors?: string[];
}

interface StageTransitionState {
  previousStage: DealStage;
  previousStatus: DealStatus;
  snapshotData: Partial<Deal>;
  timeline: TimelineEntry[];
}

@Injectable()
export class DealStageManager {
  private logger = FileLogger.getInstance();
  private transitionStates: Map<string, StageTransitionState> = new Map();

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly eventEmitter: EventEmitter2,
    private readonly processValidator: ProcessValidator,
    private readonly eventsEmitter: DealEventsEmitter,
    private readonly notificationsService: NotificationService
  ) {}

  async attemptStageTransition(
    deal: Deal,
    targetStage: DealStage,
    userId: string
  ): Promise<StageTransitionResult> {
    try {
      // Create transition state snapshot
      this.createTransitionSnapshot(deal);

      // Validate the transition using ProcessValidator
      const validation = await this.validateStageTransition(deal, targetStage);
      if (!validation.valid) {
        throw new BadRequestException(
          validation.errors.map(e => e.message).join(', ')
        );
      }

      // Perform transition
      const previousStage = deal.stage;
      deal.stage = targetStage;

      // Handle stage transition events and updates
      await this.handleStageTransition(deal, previousStage, userId);

      // Create timeline entry
      const timelineEntry = await this.createTimelineEntry(deal, previousStage, userId);

      // Clear transition state
      this.clearTransitionSnapshot(deal.id);

      return {
        success: true,
        newStage: targetStage,
        timeline: timelineEntry
      };

    } catch (error: any) {
      await this.handleTransitionError(deal, error);
      throw error;
    }
  }

  private async validateStageTransition(
    deal: Deal,
    targetStage: DealStage
  ): Promise<{ valid: boolean; errors: any[] }> {
    // Validate stage order
    if (!this.isValidTransition(deal.stage, targetStage)) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${deal.stage} to ${targetStage}`,
          severity: 'error'
        }]
      };
    }

    // Use ProcessValidator for stage requirements validation
    const validation = await this.processValidator.validateStageRequirements(deal, targetStage);
    
    return {
      valid: validation.isValid,
      errors: validation.errors
    };
  }

  async getValidationSummary(deal: Deal): Promise<{
    canProgress: boolean;
    blockers: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const validation = await this.processValidator.validateDealProcess(deal);
    
    return {
      canProgress: validation.isValid,
      blockers: validation.errors
        .filter(e => e.severity === 'error')
        .map(e => e.message),
      warnings: validation.warnings.map(w => w.message),
      recommendations: validation.suggestions
    };
  }

  async getRemainingRequirements(deal: Deal): Promise<string[]> {
    const validation = await this.processValidator.validateStageRequirements(
      deal,
      deal.stage
    );
    return validation.missingRequirements;
  }

  private async handleStageTransition(
    deal: Deal,
    previousStage: DealStage,
    userId: string
  ): Promise<void> {
    await this.eventsEmitter.emitStageTransition({
      dealId: deal.id,
      previousStage,
      newStage: deal.stage,
      actor: userId,
      timestamp: new Date(),
      metadata: {
        dealType: deal.type,
        participants: deal.participants.length
      }
    });

    // Emit validation events
    const validation = await this.processValidator.validateDealProcess(deal);
    if (!validation.isValid) {
      await this.eventsEmitter.emitValidationFailure({
        dealId: deal.id,
        stage: deal.stage,
        validationErrors: validation.errors.map(e => e.message),
        timestamp: new Date()
      });
    }

    // Check and emit stage completion
    if (validation.isValid) {
      await this.eventsEmitter.emitStageComplete(deal, deal.stage);
    }
  }

  private isValidTransition(currentStage: DealStage, targetStage: DealStage): boolean {
    const validTransitions = new Map<DealStage, DealStage[]>([
      [DealStage.INITIATION, [DealStage.EVALUATION, DealStage.DISCUSSION]],
      [DealStage.DISCUSSION, [DealStage.EVALUATION, DealStage.INITIATION]],
      [DealStage.EVALUATION, [DealStage.DOCUMENTATION, DealStage.DISCUSSION]],
      [DealStage.DOCUMENTATION, [DealStage.CLOSING, DealStage.EVALUATION]],
      [DealStage.CLOSING, [DealStage.COMPLETE, DealStage.DOCUMENTATION]],
      [DealStage.COMPLETE, []]
    ]);

    return validTransitions.get(currentStage)?.includes(targetStage) || false;
  }

  private async handleRollback(deal: Deal, fromStage: DealStage, toStage: DealStage, reason: string): Promise<void> {
    const rollbackEntry: TimelineEntry = {
      id: uuidv4(),
      type: TimelineEventType.STAGE_CHANGE,
      stage: toStage,
      status: deal.status,
      date: new Date(),
      description: `Stage rolled back from ${fromStage} to ${toStage}: ${reason}`,
      actor: 'system',
      metadata: {
        previousStage: fromStage,
        newStage: toStage,
        reason,
        automatic: false,
        isRollback: true
      }
    };
  
    deal.timeline.push(rollbackEntry);
    deal.stage = toStage;
  
    await this.eventsEmitter.emitStageRollback(
      deal.id,
      fromStage,
      toStage,
      reason
    );
  
    // Notify participants
    this.notificationsService.notifyStageChange(deal, fromStage, 'system');
  }
  

  private async handleTransitionError(deal: Deal, error: Error): Promise<void> {
    const snapshot = this.transitionStates.get(deal.id);
    if (snapshot) {
      await this.eventsEmitter.emitStageRollback(
        deal.id,
        deal.stage,
        snapshot.previousStage,
        error.message
      );

      // Restore state
      deal.stage = snapshot.previousStage;
      deal.status = snapshot.previousStatus;
      deal.timeline = snapshot.timeline;

      this.clearTransitionSnapshot(deal.id);
    }

    this.logger.error('Stage transition failed', {
      dealId: deal.id,
      error: error.message,
      stack: error.stack
    });
  }

  private createTransitionSnapshot(deal: Deal) {
    this.transitionStates.set(deal.id, {
      previousStage: deal.stage,
      previousStatus: deal.status,
      snapshotData: { ...deal },
      timeline: [...deal.timeline]
    });
  }

  private clearTransitionSnapshot(dealId: string) {
    this.transitionStates.delete(dealId);
  }

  private async createTimelineEntry(
    deal: Deal,
    previousStage: DealStage,
    userId: string
  ): Promise<TimelineEntry> {
    const entry: TimelineEntry = {
      id: uuidv4(),
      type: TimelineEventType.STAGE_CHANGE,
      stage: deal.stage,
      status: deal.status,
      date: new Date(),
      description: `Deal stage changed from ${previousStage} to ${deal.stage}`,
      actor: userId,
      metadata: {
        previousStage,
        newStage: deal.stage,
        automatic: false
      }
    };

    deal.timeline.push(entry);
    return entry;
  }
}