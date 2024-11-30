import { 
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
  IsObject,
  IsNumber,
  IsDateString,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { DealType, DealStage, DealStatus, ParticipantRole } from '../entities/deal.entity';
import { TimelineEventType } from '../interfaces/timeline.interface';
import { UserEntity } from '@/modules/users/entities/user.entity';

// Base DTOs
export class CreateDealDto {
  @IsString()
  basicInfo!: string;

  @IsString()
  participants!: string;

  @IsString()
  terms!: string;

  @IsString()
  @IsOptional()
  logistics?: string;

  @IsString()
  documents!: string;
}

// Participant Management DTOs
export class AddParticipantDto extends UserEntity {
  @IsUUID()
  userId!: string;

  @IsString()
  email!: string;

  @IsString()
  lastName!: string;

  @IsString()
  firstName!: string;

  @IsEnum(ParticipantRole)
  role!: ParticipantRole;

  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @IsObject()
  @IsOptional()
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export class UpdateParticipantDto {
  @IsUUID()
  participantId!: string;

  @IsEnum(ParticipantRole)
  @IsOptional()
  role?: ParticipantRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RemoveParticipantDto {
  @IsString()
  reason!: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;
}


// Stage & Status DTOs
export class StageTransitionDto {
  @IsEnum(DealStage)
  stage!: DealStage;

  @IsEnum(DealStage)
  targetStage!: DealStage;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class StatusUpdateDto {
  @IsEnum(DealStatus)
  status!: DealStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}


// Timeline & Validation DTOs
export class TimelineEntryDto {
  @IsEnum(TimelineEventType)
  type!: TimelineEventType;

  @IsString()
  description!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ValidationRequestDto {
  @IsEnum(DealStage)
  @IsOptional()
  targetStage?: DealStage;

  @IsBoolean()
  @IsOptional()
  detailed?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specificChecks?: string[];
}

export class StageRequirementsDto {
  @IsEnum(DealStage)
  stage!: DealStage;

  @IsBoolean()
  @IsOptional()
  includeValidation?: boolean;
}

// Parsed data interfaces
export interface DealBasicInfo {
  type: DealType;
  horseId: string;
  stage: DealStage;
  status: DealStatus;
  tags?: string[];
  notes?: string;
}

export interface DealParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  permissions: string[];
  dateAdded: Date;
  status: 'active' | 'inactive';
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface DealTerms {
  price?: number;
  currency?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  conditions: string[];
  specialTerms?: string;
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

export interface DealDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedBy: string;
  uploadDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  version: number;
  metadata?: {
    size?: number;
    mimeType?: string;
    checksum?: string;
    reviewedBy?: string;
    reviewDate?: Date;
    rejectionReason?: string;
    [key: string]: any;
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

export interface ParsedDealData {
  basicInfo: DealBasicInfo;
  participants: DealParticipant[];
  terms: DealTerms;
  logistics?: DealLogistics;
  documents: DealDocument[];
  timeline: TimelineEntry[];
}

// Stage validation responses
export interface StageValidationResult {
  canProgress: boolean;
  missingRequirements: string[];
  validationErrors: string[];
  recommendations: string[];
}

export interface StageRequirementsResponse {
  stage: DealStage;
  requirements: {
    documents: Array<{
      type: string;
      required: boolean;
      status?: 'pending' | 'approved' | 'rejected';
    }>;
    participants: Array<{
      role: ParticipantRole;
      required: boolean;
      assigned?: string;
    }>;
    conditions: Array<{
      type: string;
      description: string;
      met: boolean;
    }>;
  };
}

// New interfaces for responses
export interface ParticipantValidationResult {
  canAdd: boolean;
  canRemove: boolean;
  requiredRoles: ParticipantRole[];
  currentRoles: ParticipantRole[];
  missingRoles: ParticipantRole[];
  validationErrors: string[];
}

export interface StageTransitionValidation {
  canTransition: boolean;
  currentStage: DealStage;
  targetStage: DealStage;
  allowedTransitions: DealStage[];
  blockingIssues: string[];
  requiredActions: string[];
  recommendations: string[];
}

export interface DealSummary {
  id: string;
  type: DealType;
  stage: DealStage;
  status: DealStatus;
  progress: number;
  participants: {
    role: ParticipantRole;
    count: number;
  }[];
  lastUpdate: Date;
  nextActions: string[];
}

export class UpdateDealDto extends CreateDealDto {
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;
}