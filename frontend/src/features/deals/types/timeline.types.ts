// src/features/deals/types/timeline.types.ts

import { DealStage, DealStatus } from './deal.types';

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

export interface TimelineSummary {
    totalEntries: number;
    entriesByType: Record<TimelineEventType, number>;
    entriesByStage: Record<DealStage, number>;
    averageTimeInStage: Record<DealStage, number>;
    lastModified: Date;
}

export interface TimelineEntry {
    id: string;
    type: TimelineEventType;
    stage: DealStage;
    status: DealStatus;
    date: string;
    description: string;
    actor: string;
    metadata?: TimelineMetadata;
}
