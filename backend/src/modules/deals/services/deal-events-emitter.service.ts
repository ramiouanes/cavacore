// src/modules/deals/services/deal-events-emitter.service.ts

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealStage, DealStatus, Deal } from '../entities/deal.entity';
import { DealEventType } from '../interfaces/deal-events.interface';
import { TimelineEntry } from '../interfaces/timeline.interface';

export interface DealStageEvent {
  dealId: string;
  previousStage: DealStage;
  newStage: DealStage;
  actor: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DealValidationEvent {
  dealId: string;
  stage: DealStage;
  validationErrors: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class DealEventsEmitter {
  constructor(private eventEmitter: EventEmitter2) {}

  async emitStageTransition(event: DealStageEvent): Promise<void> {
    await this.eventEmitter.emit(DealEventType.STAGE_CHANGED, {
      type: 'STAGE_CHANGE',
      dealId: event.dealId,
      data: {
        previousStage: event.previousStage,
        newStage: event.newStage,
        timestamp: event.timestamp,
        metadata: event.metadata
      },
      actor: event.actor
    });
  }

  async emitValidationFailure(event: DealValidationEvent): Promise<void> {
    await this.eventEmitter.emit(DealEventType.VALIDATION_FAILED, {
      type: 'VALIDATION_FAILURE',
      dealId: event.dealId,
      data: {
        stage: event.stage,
        errors: event.validationErrors,
        timestamp: event.timestamp,
        metadata: event.metadata
      }
    });
  }

  async emitStageRequirementUpdate(
    dealId: string, 
    stage: DealStage,
    requirementId: string,
    met: boolean
  ): Promise<void> {
    await this.eventEmitter.emit(DealEventType.REQUIREMENT_UPDATED, {
      type: 'REQUIREMENT_UPDATE',
      dealId,
      data: {
        stage,
        requirementId,
        met,
        timestamp: new Date()
      }
    });
  }

  async emitStageRollback(
    dealId: string,
    fromStage: DealStage,
    toStage: DealStage,
    reason: string
  ): Promise<void> {
    await this.eventEmitter.emit(DealEventType.STAGE_ROLLBACK, {
      type: 'STAGE_ROLLBACK',
      dealId,
      data: {
        fromStage,
        toStage,
        reason,
        timestamp: new Date()
      }
    });
  }

  async emitTimelineUpdate(
    dealId: string,
    entry: TimelineEntry
  ): Promise<void> {
    await this.eventEmitter.emit(DealEventType.TIMELINE_UPDATED, {
      type: 'TIMELINE_UPDATE',
      dealId,
      data: {
        entry,
        timestamp: new Date()
      }
    });
  }

  async emitStageComplete(
    deal: Deal,
    stage: DealStage
  ): Promise<void> {
    await this.eventEmitter.emit(DealEventType.STAGE_COMPLETED, {
      type: 'STAGE_COMPLETED',
      dealId: deal.id,
      data: {
        stage,
        completedAt: new Date(),
        nextStage: this.getNextStage(stage),
        participants: deal.participants,
        metadata: deal.metadata
      }
    });
  }

  private getNextStage(currentStage: DealStage): DealStage | null {
    const stages = [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.EVALUATION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ];
    
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  }
}