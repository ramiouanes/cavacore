import { DealStatus, DealStage, ParticipantRole } from './deal.types';

export enum DealEventType {
  STAGE_CHANGED = 'STAGE_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  DOCUMENT_ADDED = 'DOCUMENT_ADDED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  PARTICIPANT_ADDED = 'PARTICIPANT_ADDED',
  PARTICIPANT_REMOVED = 'PARTICIPANT_REMOVED',
  PARTICIPANT_UPDATED = 'PARTICIPANT_UPDATED',
  TERMS_UPDATED = 'TERMS_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  PRESENCE_CHANGED = 'PRESENCE_CHANGED'
}

export interface DealEvent {
  type: DealEventType;
  dealId: string;
  timestamp: Date;
  actor: {
    id: string;
    role?: ParticipantRole;
  };
  data: {
    previousStage?: DealStage;
    newStage?: DealStage;
    previousStatus?: DealStatus;
    newStatus?: DealStatus;
    documentId?: string;
    documentName?: string;
    participant?: {
      id: string;
      role: ParticipantRole;
    };
    message?: string;
    connectedUsers?: string[];
    [key: string]: any;
  };
  recipients: string[];
}