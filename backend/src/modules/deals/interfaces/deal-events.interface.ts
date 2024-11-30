import { Deal, DealStage, DealStatus, ParticipantRole } from '../entities/deal.entity';
import { TimelineEntry } from './timeline.interface';
import { v4 as uuidv4 } from 'uuid';

export enum DealEventType {
  CREATED = 'deal.created',
  UPDATED = 'deal.updated',
  STAGE_CHANGED = 'deal.stage_changed',
  STATUS_CHANGED = 'deal.status_changed',
  PARTICIPANT_ADDED = 'deal.participant_added',
  PARTICIPANT_UPDATED = 'deal.participant_updated',
  DOCUMENT_ADDED = 'deal.document_added',
  DOCUMENT_UPDATED = 'deal.document_updated',
  COMMENT_ADDED = 'deal.comment_added',
  TERMS_UPDATED = 'deal.terms_updated',
  LOGISTICS_UPDATED = 'deal.logistics_updated',
  DOCUMENT_APPROVED = 'deal.document_approved',
  VALIDATION_FAILED = 'deal.validation_failed',
  REQUIREMENT_UPDATED = 'deal.requirement_updated',
  STAGE_ROLLBACK = 'deal.stage_rollback',
  TIMELINE_UPDATED = 'deal.timeline_updated',
  STAGE_COMPLETED = 'deal.stage_completed',
}

export interface DealEvent {
  id: string;
  type: DealEventType;
  dealId: string;
  timestamp: Date;
  actor: {
    id: string;
    role?: ParticipantRole;
  };
  data: {
    aggregated?: boolean;
    count?: number;
    deal?: Partial<Deal>;
    previousStage?: DealStage;
    newStage?: DealStage;
    previousStatus?: DealStatus;
    newStatus?: DealStatus;
    participant?: {
      id: string;
      userId: string;
      role: ParticipantRole;
    };
    document?: {
      id: string;
      name: string;
      type: string;
      version?: number;
    };
    comment?: {
      id: string;
      content: string;
    };
    termsUpdated?: string[];
    logisticsUpdated?: string[];
    metadata?: Record<string, any>;
    description?: string;
    reason?: string;
    entry?: TimelineEntry;
    events?: DealEvent[];
  };
  recipients: string[]; // User IDs who should receive this event
  metadata?: Record<string, any>;
}

export interface DealEventHandler {
  handleDealCreated(deal: Deal): Promise<void>;
  handleDealUpdated(deal: Deal, updatedFields: string[]): Promise<void>;
  handleStageChanged(deal: Deal, previousStage: DealStage): Promise<void>;
  handleStatusChanged(deal: Deal, previousStatus: DealStatus): Promise<void>;
  handleParticipantAdded(deal: Deal, participantId: string): Promise<void>;
  handleParticipantUpdated(deal: Deal, participantId: string): Promise<void>;
  handleDocumentAdded(deal: Deal, documentId: string): Promise<void>;
  handleDocumentUpdated(deal: Deal, documentId: string): Promise<void>;
  handleCommentAdded(deal: Deal, commentId: string): Promise<void>;
  handleTermsUpdated(deal: Deal, updatedTerms: string[]): Promise<void>;
  handleLogisticsUpdated(deal: Deal, updatedFields: string[]): Promise<void>;
}

export interface DealEventSubscriber {
  onDealEvent(event: DealEvent): Promise<void>;
}

export interface DealEventEmitter {
  emit(event: DealEvent): Promise<void>;
  subscribe(subscriber: DealEventSubscriber): void;
  unsubscribe(subscriber: DealEventSubscriber): void;
}

// Utility type for type-safe event data
export type DealEventData<T extends DealEventType> =
  T extends DealEventType.CREATED ? { deal: Deal, description?: string; } :
  T extends DealEventType.STAGE_CHANGED ? {
    deal: Deal;
    previousStage: DealStage;
    newStage: DealStage;
    description?: string;
  } :
  T extends DealEventType.STATUS_CHANGED ? {
    deal: Deal;
    previousStatus: DealStatus;
    newStatus: DealStatus;
    description?: string;
  } :
  T extends DealEventType.PARTICIPANT_ADDED | DealEventType.PARTICIPANT_UPDATED ? {
    deal: Deal;
    participant: {
      id: string;
      userId: string;
      role: ParticipantRole;
    }
    description?: string;
  } :
  T extends DealEventType.DOCUMENT_ADDED | DealEventType.DOCUMENT_UPDATED ? {
    deal: Deal;
    document: {
      id: string;
      name: string;
      type: string;
      version?: number;
    }
    description?: string;
  } :
  T extends DealEventType.COMMENT_ADDED ? {
    deal: Deal;
    comment: {
      id: string;
      content: string;
    }
    description?: string;
  } :
  T extends DealEventType.TERMS_UPDATED ? {
    deal: Deal;
    termsUpdated: string[];
    description?: string;
  } :
  T extends DealEventType.LOGISTICS_UPDATED ? {
    deal: Deal;
    logisticsUpdated: string[];
    description?: string;
  } :
  { deal: Partial<Deal>; description?: string };

// Helper type for creating type-safe events
export interface CreateDealEventOptions<T extends DealEventType> {
  type: T;
  dealId: string;
  actorId: string;
  actorRole?: ParticipantRole;
  data: DealEventData<T>;
  recipients: string[];
  metadata?: Record<string, any>;
}

export function createDealEvent<T extends DealEventType>(
  options: CreateDealEventOptions<T>
): DealEvent {
  return {
    id: uuidv4(),
    type: options.type,
    dealId: options.dealId,
    timestamp: new Date(),
    actor: {
      id: options.actorId,
      role: options.actorRole
    },
    data: options.data as any,
    recipients: options.recipients,
    metadata: options.metadata
  };
}