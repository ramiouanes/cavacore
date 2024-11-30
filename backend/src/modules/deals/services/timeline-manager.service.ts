import { Injectable, NotFoundException } from '@nestjs/common';
import { Deal, DealStage, DealStatus } from '../entities/deal.entity';
import { TimelineEntry, TimelineEventType, TimelineMetadata } from '../interfaces/timeline.interface';
import { FileLogger } from '../../../utils/logger';
import { randomUUID } from 'crypto';
import { DealDocument } from '../dto/deal.dto';
import { DealEventsGateway } from '../gateways/deal-events.gateway';
import { DealEventType } from '../interfaces/deal-events.interface';

interface DocumentStatusEvent {
  documentId: string;
  status: 'pending' | 'approved' | 'rejected';
  metadata?: {
    reviewedBy?: string;
    reviewDate?: string;
    rejectionReason?: string;
  };
}

@Injectable()
export class TimelineManager {
  private logger = FileLogger.getInstance();
  private readonly MAX_HISTORY_ENTRIES = 100;
  private stageHistory: Map<string, TimelineEntry[]> = new Map();

  constructor(private readonly eventsGateway: DealEventsGateway) { }



  async addTimelineEntry(
    deal: any,
    type: TimelineEventType,
    description: string,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    const entry: TimelineEntry = {
      id: randomUUID(),
      type,
      stage: deal.stage,
      status: deal.status,
      date: new Date(),
      description,
      actor: actorId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        dealType: deal.type,
        dealId: deal.id
      }
    };

    this.logger.log('Creating timeline entry', { dealId: deal.id, entry });
    try {
      deal.timeline.push(entry);
      this.pruneTimeline(deal);
      await this.updateStageHistory(deal, entry);
      await this.emitTimelineEvent(deal, entry);
      return entry;
    } catch (error) {
      this.logger.error('Error creating timeline entry', error);
      throw error;
    }
  }

  private async pruneTimeline(deal: Deal) {
    if (deal.timeline.length > this.MAX_HISTORY_ENTRIES) {
      const excess = deal.timeline.length - this.MAX_HISTORY_ENTRIES;
      deal.timeline.splice(0, excess);
    }
  }

  private async updateStageHistory(deal: Deal, entry: TimelineEntry) {
    if (!this.stageHistory.has(deal.id)) {
      this.stageHistory.set(deal.id, []);
    }
    this.stageHistory.get(deal.id)?.push(entry);
  }

  async addTransitionFailureEntry(
    deal: Deal,
    error: Error,
    targetStage: DealStage,
    actorId: string
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.STAGE_CHANGE,
      `Stage transition to ${targetStage} failed: ${error.message}`,
      actorId,
      {
        error: error.message,
        targetStage,
        automatic: false,
        success: false
      }
    );
  }

  async addRollbackEntry(
    deal: Deal,
    fromStage: DealStage,
    toStage: DealStage,
    reason: string,
    actorId: string
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.STAGE_CHANGE,
      `Stage rolled back from ${fromStage} to ${toStage}: ${reason}`,
      actorId,
      {
        previousStage: fromStage,
        newStage: toStage,
        reason,
        automatic: true,
        isRollback: true
      }
    );
  }

  private async emitTimelineEvent(deal: Deal, entry: TimelineEntry) {
    this.eventsGateway.emitDealEvent({
      id: randomUUID(),
      type: DealEventType.TIMELINE_UPDATED,
      dealId: deal.id,
      timestamp: new Date(),
      actor: { id: entry.actor },
      data: { metadata: { entry } },
      recipients: deal.participants.map(p => p.userId)
    });
  }


  async addStageChangeEntry(
    deal: any,
    previousStage: DealStage,
    newStage: DealStage,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.STAGE_CHANGE,
      `Deal stage changed from ${previousStage} to ${newStage}`,
      actorId,
      {
        ...metadata,
        previousStage,
        newStage,
        automatic: metadata?.automatic || false
      }
    );
  }

  async addStatusChangeEntry(
    deal: Deal,
    previousStatus: DealStatus,
    newStatus: DealStatus,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.STATUS_CHANGE,
      `Deal status changed from ${previousStatus} to ${newStatus}`,
      actorId,
      {
        ...metadata,
        previousStatus,
        newStatus,
        automatic: metadata?.automatic || false
      }
    );
  }

  async addParticipantEntry(
    deal: Deal,
    action: 'ADDED' | 'REMOVED' | 'UPDATED',
    participantId: string,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    const participant = deal.participants.find(p => p.id === participantId);
    const description = `Participant ${participant?.userId} was ${action.toLowerCase()}`;

    return this.addTimelineEntry(
      deal,
      TimelineEventType.PARTICIPANT_CHANGE,
      description,
      actorId,
      {
        ...metadata,
        action,
        participantId,
        participantRole: participant?.role
      }
    );
  }

  async addDocumentEntry(
    deal: Deal,
    action: 'UPLOADED' | 'UPDATED' | 'REMOVED' | 'APPROVED' | 'REJECTED',
    documentId: string,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    const document = deal.documents.find(d => d.id === documentId);
    const description = `Document "${document?.name}" was ${action.toLowerCase()}`;

    return this.addTimelineEntry(
      deal,
      TimelineEventType.DOCUMENT_CHANGE,
      description,
      actorId,
      {
        ...metadata,
        action,
        documentId,
        documentType: document?.type
      }
    );
  }

  async trackDocumentStatus(
    deal: Deal,
    event: DocumentStatusEvent,
    actorId: string
  ): Promise<TimelineEntry> {
    const document = deal.documents.find(doc => doc.id === event.documentId);
    if (!document) throw new NotFoundException('Document not found');

    // Track state transition
    const previousStatus = document.status;
    document.status = event.status;
    document.metadata = {
      ...document.metadata,
      ...event.metadata,
      reviewDate: event.metadata?.reviewDate ? new Date(event.metadata.reviewDate) : undefined,
      statusHistory: [
        ...(document.metadata?.statusHistory || []),
        {
          from: previousStatus,
          to: event.status,
          date: new Date().toISOString(),
          actor: actorId,
          reason: event.metadata?.rejectionReason
        }
      ]
    };

    // Check if this affects deal stage requirements
    const stageRequirements = this.getStageDocumentRequirements(deal.stage);
    const meetsRequirements = this.checkDocumentRequirements(deal.documents, stageRequirements);

    return this.addTimelineEntry(
      deal,
      TimelineEventType.DOCUMENT_CHANGE,
      `Document "${document.name}" ${event.status}`,
      actorId,
      {
        documentId: event.documentId,
        previousStatus: DealStatus[previousStatus.toUpperCase() as keyof typeof DealStatus],
        newStatus: DealStatus[event.status.toUpperCase() as keyof typeof DealStatus],
        affectsStageProgress: !meetsRequirements,
        metadata: event.metadata
      }
    );
  }

  async addTermsChangeEntry(
    deal: Deal,
    changedFields: string[],
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    const description = `Deal terms updated: ${changedFields.join(', ')}`;

    return this.addTimelineEntry(
      deal,
      TimelineEventType.TERMS_CHANGE,
      description,
      actorId,
      {
        ...metadata,
        changedFields
      }
    );
  }

  async addLogisticsChangeEntry(
    deal: Deal,
    component: 'transportation' | 'inspection' | 'insurance',
    changedFields: string[],
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    const description = `${component.charAt(0).toUpperCase() + component.slice(1)} details updated: ${changedFields.join(', ')}`;

    return this.addTimelineEntry(
      deal,
      TimelineEventType.LOGISTICS_CHANGE,
      description,
      actorId,
      {
        ...metadata,
        component,
        changedFields
      }
    );
  }

  async addCommentEntry(
    deal: Deal,
    comment: string,
    actorId: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.COMMENT,
      comment,
      actorId,
      metadata
    );
  }

  async addSystemEntry(
    deal: Deal,
    description: string,
    metadata?: TimelineMetadata
  ): Promise<TimelineEntry> {
    return this.addTimelineEntry(
      deal,
      TimelineEventType.SYSTEM,
      description,
      'system',
      {
        ...metadata,
        automatic: true
      }
    );
  }

  getTimelineEntriesByType(
    deal: Deal,
    type: TimelineEventType
  ): TimelineEntry[] {
    return deal.timeline.filter(entry => entry.type === type);
  }

  getTimelineEntriesForStage(
    deal: Deal,
    stage: DealStage
  ): TimelineEntry[] {
    return deal.timeline.filter(entry => entry.stage === stage);
  }

  getTimelineEntriesByActor(
    deal: Deal,
    actorId: string
  ): TimelineEntry[] {
    return deal.timeline.filter(entry => entry.actor === actorId);
  }

  getTimelineEntriesInDateRange(
    deal: Deal,
    startDate: Date,
    endDate: Date
  ): TimelineEntry[] {
    return deal.timeline.filter(entry =>
      entry.date >= startDate && entry.date <= endDate
    );
  }

  async summarizeTimeline(deal: Deal): Promise<{
    totalEntries: number;
    entriesByType: Record<TimelineEventType, number>;
    entriesByStage: Record<DealStage, number>;
    averageTimeInStage: Record<DealStage, number>;
    lastModified: Date;
  }> {
    const entriesByType = deal.timeline.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<TimelineEventType, number>);

    const entriesByStage = deal.timeline.reduce((acc, entry) => {
      acc[entry.stage] = (acc[entry.stage] || 0) + 1;
      return acc;
    }, {} as Record<DealStage, number>);

    const stageChanges = this.getTimelineEntriesByType(deal, TimelineEventType.STAGE_CHANGE);
    const averageTimeInStage = this.calculateAverageTimeInStages(deal, stageChanges);

    return {
      totalEntries: deal.timeline.length,
      entriesByType,
      entriesByStage,
      averageTimeInStage,
      lastModified: deal.timeline[deal.timeline.length - 1]?.date || deal.createdAt
    };
  }

  private getStageDocumentRequirements(stage: DealStage): string[] {
    const requirements: Record<DealStage, string[]> = {
      [DealStage.INITIATION]: [],
      [DealStage.DISCUSSION]: [],
      [DealStage.EVALUATION]: [],
      [DealStage.DOCUMENTATION]: ['contract', 'terms_agreement'],
      [DealStage.CLOSING]: ['signed_contract', 'payment_confirmation'],
      [DealStage.COMPLETE]: ['transfer_of_ownership']
    };
    return requirements[stage] || [];
  }

  private checkDocumentRequirements(
    documents: DealDocument[],
    required: string[]
  ): boolean {
    return required.every(type =>
      documents.some(doc =>
        doc.type === type &&
        doc.status === 'approved'
      )
    );
  }

  private calculateAverageTimeInStages(
    deal: any,
    stageChanges: TimelineEntry[]
  ): Record<DealStage, number> {
    const stageTime: Record<DealStage, number[]> = {
      [DealStage.INITIATION]: [],
      [DealStage.DISCUSSION]: [],
      [DealStage.EVALUATION]: [],
      [DealStage.DOCUMENTATION]: [],
      [DealStage.CLOSING]: [],
      [DealStage.COMPLETE]: []
    };
    let lastStageChange = deal.createdAt;
    let currentStage = DealStage.INITIATION;

    // Calculate time spent in each stage
    stageChanges.forEach(change => {
      const timeInStage = change.date.getTime() - lastStageChange.getTime();
      if (!stageTime[currentStage]) {
        stageTime[currentStage] = [];
      }
      stageTime[currentStage].push(timeInStage);

      lastStageChange = change.date;
      currentStage = change.metadata?.newStage as DealStage;
    });

    // Add time in current stage
    const timeInCurrentStage = new Date().getTime() - new Date(lastStageChange).getTime();

    if (!stageTime[currentStage]) {
      stageTime[currentStage] = [];
    }
    stageTime[currentStage].push(timeInCurrentStage);

    // Calculate averages
    return Object.entries(stageTime).reduce((acc, [stage, times]) => {
      acc[stage as DealStage] = times.reduce((sum, time) => sum + time, 0) / times.length;
      return acc;
    }, {} as Record<DealStage, number>);
  }
}