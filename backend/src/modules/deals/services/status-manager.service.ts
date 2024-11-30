import { Injectable, BadRequestException } from '@nestjs/common';
import { Deal, DealStatus, DealStage } from '../entities/deal.entity';
import { FileLogger } from '../../../utils/logger';
import { TimelineEntry, TimelineEventType } from '../interfaces/timeline.interface';
import { v4 as uuidv4 } from 'uuid';

export interface StatusTransitionResult {
  success: boolean;
  newStatus: DealStatus;
  timeline: TimelineEntry;
  validationErrors?: string[];
}

@Injectable()
export class StatusManager {
  private logger = FileLogger.getInstance();

  private statusTransitions = new Map<DealStatus, DealStatus[]>([
    [DealStatus.ACTIVE, [DealStatus.ON_HOLD, DealStatus.CANCELLED, DealStatus.COMPLETED]],
    [DealStatus.ON_HOLD, [DealStatus.ACTIVE, DealStatus.CANCELLED]],
    [DealStatus.CANCELLED, []],
    [DealStatus.COMPLETED, []],
    [DealStatus.PENDING, [DealStatus.ACTIVE, DealStatus.CANCELLED]]
  ]);

  private stageStatusRestrictions = new Map<DealStage, DealStatus[]>([
    [DealStage.INITIATION, [DealStatus.ACTIVE, DealStatus.CANCELLED]],
    [DealStage.DISCUSSION, [DealStatus.ACTIVE, DealStatus.ON_HOLD, DealStatus.CANCELLED]],
    [DealStage.EVALUATION, [DealStatus.ACTIVE, DealStatus.ON_HOLD, DealStatus.CANCELLED]],
    [DealStage.DOCUMENTATION, [DealStatus.ACTIVE, DealStatus.ON_HOLD, DealStatus.CANCELLED]],
    [DealStage.CLOSING, [DealStatus.ACTIVE, DealStatus.ON_HOLD, DealStatus.CANCELLED]],
    [DealStage.COMPLETE, [DealStatus.COMPLETED]]
  ]);

  async attemptStatusTransition(
    deal: Deal,
    targetStatus: DealStatus,
    userId: string,
    reason?: string
  ): Promise<StatusTransitionResult> {
    try {
      this.logger.log('Attempting status transition', {
        dealId: deal.id,
        currentStatus: deal.status,
        targetStatus,
        userId
      });

      // Validate the transition is allowed
      if (!this.isValidTransition(deal.status, targetStatus)) {
        throw new BadRequestException(
          `Invalid status transition from ${deal.status} to ${targetStatus}`
        );
      }

      // Validate stage allows this status
      if (!this.isStatusAllowedForStage(deal.stage, targetStatus)) {
        throw new BadRequestException(
          `Status ${targetStatus} not allowed in ${deal.stage} stage`
        );
      }

      // Additional validations based on target status
      await this.validateStatusRequirements(deal, targetStatus);

      // Create timeline entry
      const timelineEntry: TimelineEntry = {
        id: uuidv4(),
        type: TimelineEventType.STATUS_CHANGE,
        stage: deal.stage,
        status: targetStatus,
        date: new Date(),
        description: `Deal status changed to ${targetStatus}${reason ? ': ' + reason : ''}`,
        actor: userId,
        metadata: {
          previousStatus: deal.status,
          newStatus: targetStatus,
          reason,
          automatic: false
        }
      };

      return {
        success: true,
        newStatus: targetStatus,
        timeline: timelineEntry
      };

    } catch (error: any) {
      this.logger.error('Status transition failed', error);
      return {
        success: false,
        newStatus: deal.status,
        timeline: {
          id: uuidv4(),
          type: TimelineEventType.STATUS_CHANGE,
          stage: deal.stage,
          status: deal.status,
          date: new Date(),
          description: `Failed to change status to ${targetStatus}: ${error.message}`,
          actor: userId,
          metadata: {
            targetStatus,
            error: error.message,
            reason
          }
        },
        validationErrors: [error.message]
      };
    }
  }

  private isValidTransition(currentStatus: DealStatus, targetStatus: DealStatus): boolean {
    const allowedTransitions = this.statusTransitions.get(currentStatus) || [];
    return allowedTransitions.includes(targetStatus);
  }

  private isStatusAllowedForStage(stage: DealStage, status: DealStatus): boolean {
    const allowedStatuses = this.stageStatusRestrictions.get(stage) || [];
    return allowedStatuses.includes(status);
  }

  private async validateStatusRequirements(
    deal: Deal,
    targetStatus: DealStatus
  ): Promise<void> {
    switch (targetStatus) {
      case DealStatus.COMPLETED:
        await this.validateCompletionRequirements(deal);
        break;
      
      case DealStatus.ON_HOLD:
        this.validateHoldRequirements(deal);
        break;
      
      case DealStatus.CANCELLED:
        this.validateCancellationRequirements(deal);
        break;
      
      case DealStatus.ACTIVE:
        await this.validateActivationRequirements(deal);
        break;
    }
  }

  private async validateCompletionRequirements(deal: Deal): Promise<void> {
    const requiredDocuments = [
      'signed_contract',
      'transfer_of_ownership',
      'payment_confirmation'
    ];

    const hasAllDocs = requiredDocuments.every(docType =>
      deal.documents.some(doc => 
        doc.type === docType && 
        doc.status === 'approved'
      )
    );

    if (!hasAllDocs) {
      throw new BadRequestException('Missing required documents for completion');
    }

    // Additional completion validations could be added here
  }

  private validateHoldRequirements(deal: Deal): void {
    // Example validation - ensure there's a reason provided
    if (!deal.timeline[deal.timeline.length - 1]?.metadata?.reason) {
      throw new BadRequestException('Reason required for putting deal on hold');
    }

    // Add more hold-specific validations as needed
  }

  private validateCancellationRequirements(deal: Deal): void {
    // Example validation - ensure there's a reason provided
    if (!deal.timeline[deal.timeline.length - 1]?.metadata?.reason) {
      throw new BadRequestException('Reason required for cancellation');
    }

    // Add more cancellation-specific validations as needed
  }

  private async validateActivationRequirements(deal: Deal): Promise<void> {
    if (deal.status === DealStatus.ON_HOLD) {
      // Check if hold period minimum time has passed
      const lastHoldEntry = deal.timeline
        .reverse()
        .find(entry => 
          entry.metadata?.type === 'STATUS_CHANGE' && 
          entry.metadata?.newStatus === DealStatus.ON_HOLD
        );

      if (lastHoldEntry) {
        const holdDuration = Date.now() - lastHoldEntry.date.getTime();
        const minimumHoldDuration = 24 * 60 * 60 * 1000; // 24 hours

        if (holdDuration < minimumHoldDuration) {
          throw new BadRequestException('Minimum hold period not met');
        }
      }
    }

    // Add more activation-specific validations as needed
  }

  getRequiredDocumentsForStatus(status: DealStatus): string[] {
    switch (status) {
      case DealStatus.COMPLETED:
        return [
          'signed_contract',
          'transfer_of_ownership',
          'payment_confirmation'
        ];
      
      case DealStatus.ACTIVE:
        return [
          'terms_agreement',
          'participant_confirmation'
        ];
      
      default:
        return [];
    }
  }

  async validateCurrentStatus(deal: Deal): Promise<string[]> {
    try {
      await this.validateStatusRequirements(deal, deal.status);
      return [];
    } catch (error: any) {
      return [error.message];
    }
  }
}