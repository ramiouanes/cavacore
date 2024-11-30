// src/features/deals/types/deal.types.ts

import { Horse } from '@/features/horses/types';
import { TimelineEventType } from './timeline.types';

export interface StageRequirement {
  type: 'document' | 'participant' | 'approval' | 'condition';
  description: string;
}

export enum DealType {
  FULL_SALE = 'Full Sale',
  LEASE = 'Lease',
  PARTNERSHIP = 'Partnership',
  BREEDING = 'Breeding',
  TRAINING = 'Training'
}

export type UploadProgressCallback = (progress: number) => void;

export interface DealCreateResponse {
  deal: Deal;
  id: string;
  message: string;
}

export enum DealStage {
  INITIATION = 'Initiation',
  DISCUSSION = 'Discussion',
  EVALUATION = 'Evaluation',
  DOCUMENTATION = 'Documentation',
  CLOSING = 'Closing',
  COMPLETE = 'Complete'
}

export enum DealStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed'
}

export const DEAL_STAGE_REQUIREMENTS: Record<DealType, Record<DealStage, StageRequirement[]>> = {
  [DealType.FULL_SALE]: {
    [DealStage.INITIATION]: [
      { type: 'participant', description: 'Seller must be assigned' },
      { type: 'participant', description: 'Buyer must be assigned' },
      { type: 'document', description: 'Intent to purchase document' }
    ],
    [DealStage.DISCUSSION]: [
      { type: 'condition', description: 'Sale price must be agreed' },
      { type: 'condition', description: 'Payment terms must be defined' },
      { type: 'document', description: 'Initial sales agreement' }
    ],
    [DealStage.EVALUATION]: [
      { type: 'participant', description: 'Veterinarian must be assigned' },
      { type: 'document', description: 'Veterinary examination report' },
      { type: 'document', description: 'Pre-purchase examination report' },
      { type: 'approval', description: 'Buyer approval of examination results' }
    ],
    [DealStage.DOCUMENTATION]: [
      { type: 'document', description: 'Bill of sale' },
      { type: 'document', description: 'Transfer of ownership' },
      { type: 'document', description: 'Insurance certificate' },
      { type: 'approval', description: 'Legal review completion' }
    ],
    [DealStage.CLOSING]: [
      { type: 'document', description: 'Signed bill of sale' },
      { type: 'document', description: 'Payment confirmation' },
      { type: 'approval', description: 'Seller final approval' },
      { type: 'approval', description: 'Buyer final approval' }
    ],
    [DealStage.COMPLETE]: [
      { type: 'document', description: 'Completed transfer documentation' },
      { type: 'document', description: 'Final payment confirmation' },
      { type: 'approval', description: 'Registration transfer confirmation' }
    ]
  },
  [DealType.LEASE]: {
    [DealStage.INITIATION]: [
      { type: 'participant', description: 'Lessor must be assigned' },
      { type: 'participant', description: 'Lessee must be assigned' },
      { type: 'document', description: 'Initial lease terms' }
    ],
    [DealStage.DISCUSSION]: [
      { type: 'condition', description: 'Lease duration must be specified' },
      { type: 'condition', description: 'Monthly payment terms agreed' },
      { type: 'document', description: 'Draft lease agreement' }
    ],
    [DealStage.EVALUATION]: [
      { type: 'document', description: 'Current condition report' },
      { type: 'document', description: 'Insurance requirements' },
      { type: 'approval', description: 'Facility inspection report' }
    ],
    [DealStage.DOCUMENTATION]: [
      { type: 'document', description: 'Final lease agreement' },
      { type: 'document', description: 'Insurance certificates' },
      { type: 'document', description: 'Payment schedule' }
    ],
    [DealStage.CLOSING]: [
      { type: 'document', description: 'Signed lease agreement' },
      { type: 'document', description: 'First payment confirmation' },
      { type: 'approval', description: 'Both parties final approval' }
    ],
    [DealStage.COMPLETE]: [
      { type: 'document', description: 'Handover documentation' },
      { type: 'approval', description: 'Property condition confirmation' }
    ]
  },
  [DealType.BREEDING]: {
    [DealStage.INITIATION]: [
      { type: 'participant', description: 'Stallion owner assigned' },
      { type: 'participant', description: 'Mare owner assigned' },
      { type: 'document', description: 'Initial breeding request' }
    ],
    [DealStage.DISCUSSION]: [
      { type: 'condition', description: 'Breeding fees agreed' },
      { type: 'condition', description: 'Breeding dates proposed' },
      { type: 'document', description: 'Draft breeding contract' }
    ],
    [DealStage.EVALUATION]: [
      { type: 'participant', description: 'Veterinarian assigned' },
      { type: 'document', description: 'Mare health certificate' },
      { type: 'document', description: 'Stallion breeding soundness' }
    ],
    [DealStage.DOCUMENTATION]: [
      { type: 'document', description: 'Final breeding contract' },
      { type: 'document', description: 'Health certificates' },
      { type: 'document', description: 'Insurance documentation' }
    ],
    [DealStage.CLOSING]: [
      { type: 'document', description: 'Signed breeding contract' },
      { type: 'document', description: 'Payment confirmation' },
      { type: 'approval', description: 'Final veterinary clearance' }
    ],
    [DealStage.COMPLETE]: [
      { type: 'document', description: 'Breeding confirmation' },
      { type: 'document', description: 'Live foal guarantee terms' }
    ]
  },
  [DealType.TRAINING]: {
    [DealStage.INITIATION]: [
      { type: 'participant', description: 'Owner assigned' },
      { type: 'participant', description: 'Trainer assigned' },
      { type: 'document', description: 'Training request form' }
    ],
    [DealStage.DISCUSSION]: [
      { type: 'condition', description: 'Training goals defined' },
      { type: 'condition', description: 'Training duration agreed' },
      { type: 'document', description: 'Training program outline' }
    ],
    [DealStage.EVALUATION]: [
      { type: 'document', description: 'Initial assessment report' },
      { type: 'document', description: 'Current skill level evaluation' },
      { type: 'approval', description: 'Training facility approval' }
    ],
    [DealStage.DOCUMENTATION]: [
      { type: 'document', description: 'Training agreement' },
      { type: 'document', description: 'Liability release' },
      { type: 'document', description: 'Payment schedule' }
    ],
    [DealStage.CLOSING]: [
      { type: 'document', description: 'Signed training contract' },
      { type: 'document', description: 'Initial payment confirmation' },
      { type: 'approval', description: 'Start date confirmation' }
    ],
    [DealStage.COMPLETE]: [
      { type: 'document', description: 'Training completion report' },
      { type: 'document', description: 'Progress evaluation' },
      { type: 'approval', description: 'Owner satisfaction confirmation' }
    ]
  },
  [DealType.PARTNERSHIP]: {
    [DealStage.INITIATION]: [
      { type: 'participant', description: 'All partners assigned' },
      { type: 'document', description: 'Partnership proposal' },
      { type: 'condition', description: 'Initial share distribution' }
    ],
    [DealStage.DISCUSSION]: [
      { type: 'condition', description: 'Partnership terms agreed' },
      { type: 'condition', description: 'Financial responsibilities defined' },
      { type: 'document', description: 'Draft partnership agreement' }
    ],
    [DealStage.EVALUATION]: [
      { type: 'document', description: 'Horse valuation report' },
      { type: 'document', description: 'Financial capability proof' },
      { type: 'approval', description: 'All partners initial approval' }
    ],
    [DealStage.DOCUMENTATION]: [
      { type: 'document', description: 'Partnership agreement' },
      { type: 'document', description: 'Insurance documentation' },
      { type: 'document', description: 'Management plan' }
    ],
    [DealStage.CLOSING]: [
      { type: 'document', description: 'Signed partnership agreement' },
      { type: 'document', description: 'Initial payment confirmations' },
      { type: 'approval', description: 'All partners final approval' }
    ],
    [DealStage.COMPLETE]: [
      { type: 'document', description: 'Partnership registration' },
      { type: 'document', description: 'Bank account setup' },
      { type: 'approval', description: 'Operating procedures confirmation' }
    ]
  }
};

export enum ParticipantRole {
  SELLER = 'Seller',
  BUYER = 'Buyer',
  AGENT = 'Agent',
  VETERINARIAN = 'Veterinarian',
  TRAINER = 'Trainer',
  INSPECTOR = 'Inspector',
  TRANSPORTER = 'Transporter'
}

export interface DealTerms {
  price?: number;
  currency?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  conditions?: string[];
  specialTerms?: string;
}

export interface DealParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  permissions: string[];
  // dateAdded: string;
  // status: 'active' | 'inactive';
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface DealDocument {
  id?: string;
  documentType: string;
  name: string;
  url?: string;
  uploadedBy?: string;
  uploadDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  version?: number;
  metadata?: {
    size?: number;
    mimeType?: string;
    checksum?: string;
    reviewedBy?: string;
    reviewDate?: Date;
    rejectionReason?: string;
    [key: string]: any;
  };
  dealId?: string;
  file?: File;
}



export interface DealLogistics {
  transportation?: {
    pickupLocation: string;
    deliveryLocation: string;
    date: string;
    provider?: string;
    requirements: string[];
    status: 'pending' | 'scheduled' | 'completed';
    cost?: number;
  };
  inspection?: {
    date: string;
    location: string;
    inspector: string;
    requirements: string[];
    status: 'pending' | 'scheduled' | 'completed';
    results?: string;
    cost?: number;
  };
  insurance?: {
    provider: string;
    coverage: string;
    policyNumber: string;
    startDate: string;
    endDate: string;
    cost: number;
    status: 'pending' | 'active' | 'expired';
  };
}

export interface TimelineEntry {
  id: string;
  type: TimelineEventType;
  stage: DealStage;
  status: DealStatus;
  date: string;
  description: string;
  actor: string;
  metadata?: {
    previousStage?: DealStage;
    newStage?: DealStage;
    previousStatus?: DealStatus;
    newStatus?: DealStatus;
    reason?: string;
    automatic?: boolean;
    documentId?: string;
    participantId?: string;
    [key: string]: any;
  };
}

export interface DealBasicInfo {
  type: DealType,
  horseId: string,
  stage: DealStage;
  status: DealStatus;
  // horse: Horse,
  tags: string[],
  notes: string
}

export interface Deal {
  id: string;
  basicInfo: DealBasicInfo;
  terms: DealTerms;
  logistics?: DealLogistics;
  timeline: TimelineEntry[];
  participants: DealParticipant[];
  documents: DealDocument[];
  createdById: string;
  horse: Horse;
  createdBy?: any; // Will be populated from user entity
  metadata?: {
    priority?: 'low' | 'medium' | 'high';
    expectedClosingDate?: string;
    customFields?: Record<string, any>;
    automationSettings?: {
      autoUpdateStatus: boolean;
      notifyParticipants: boolean;
      reminderEnabled: boolean;
    };
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}