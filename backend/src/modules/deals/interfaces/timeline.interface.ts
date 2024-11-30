import { DealStage, DealStatus } from '../entities/deal.entity';

export enum TimelineEventType {
    STAGE_CHANGE = 'STAGE_CHANGE',
    STATUS_CHANGE = 'STATUS_CHANGE',
    PARTICIPANT_CHANGE = 'PARTICIPANT_CHANGE',
    DOCUMENT_CHANGE = 'DOCUMENT_CHANGE',
    TERMS_CHANGE = 'TERMS_CHANGE',
    LOGISTICS_CHANGE = 'LOGISTICS_CHANGE',
    COMMENT = 'COMMENT',
    SYSTEM = 'SYSTEM'
  }  

export interface TimelineMetadata {
  automatic?: boolean;
  previousStage?: DealStage;
  newStage?: DealStage;
  previousStatus?: DealStatus;
  newStatus?: DealStatus;
  action?: string;
  participantId?: string;
  participantRole?: string;
  documentId?: string;
  documentType?: string;
  changedFields?: string[];
  component?: 'transportation' | 'inspection' | 'insurance';
  [key: string]: any;
}

export interface TimelineEntry {
  id: string;
  type: TimelineEventType;
  date: Date;
  stage: DealStage;
  status: DealStatus;
  description: string;
  actor: string;
  metadata?: TimelineMetadata;
}

export interface TimelineSummary {
  totalEntries: number;
  entriesByType: Record<TimelineEventType, number>;
  entriesByStage: Record<DealStage, number>;
  averageTimeInStage: Record<DealStage, number>;
  lastModified: Date;
}