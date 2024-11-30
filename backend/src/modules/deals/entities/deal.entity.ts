import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  Check,
  OneToMany
} from 'typeorm';
import { Horse } from '../../horses/entities/horse.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TimelineEventType } from '../interfaces/timeline.interface';
import { DealDocument } from '../dto/deal.dto';

export enum DealType {
  FULL_SALE = 'Full Sale',
  LEASE = 'Lease',
  PARTNERSHIP = 'Partnership',
  BREEDING = 'Breeding',
  TRAINING = 'Training'
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
  COMPLETED = 'Completed',
  INACTIVE = 'Inactive'
}

export enum ParticipantRole {
  SELLER = 'Seller',
  BUYER = 'Buyer',
  AGENT = 'Agent',
  VETERINARIAN = 'Veterinarian',
  TRAINER = 'Trainer',
  INSPECTOR = 'Inspector',
  TRANSPORTER = 'Transporter'
}

@Entity('deals')
@Check(`"stage" = 'Complete' AND "status" = 'Completed' OR "stage" != 'Complete'`)
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('enum', { enum: DealType })
  @Index()
  type!: DealType;

  @Column('enum', { enum: DealStage, default: DealStage.INITIATION })
  @Index()
  stage!: DealStage;

  @Column('enum', { enum: DealStatus, default: DealStatus.ACTIVE })
  @Index()
  status!: DealStatus;

  @Column('jsonb')
  basicInfo!: {
    horseId: string;
    tags?: string[];
    notes?: string;
  };

  @Column('jsonb')
  terms!: {
    price?: number;
    currency?: string;
    duration?: number;
    startDate?: string;
    endDate?: string;
    conditions: string[];
    specialTerms?: string;
  };

  @Column('jsonb')
  participants!: Array<{
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
  }>;

  @Column('jsonb')
  documents!: DealDocument[];

  @Column('jsonb')
  logistics?: {
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
  };

  @Column('jsonb')
  timeline!: Array<{
    id: string;
    type: TimelineEventType;
    stage: DealStage;
    status: DealStatus;
    date: Date;
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
  }>;

  @Column('jsonb', { nullable: true })
  stageRequirements!: {
    [key in DealStage]?: {
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
  };

  @Column('jsonb', { nullable: true })
  validationResults?: {
    lastChecked: Date;
    stage: DealStage;
    isValid: boolean;
    errors: Array<{
      code: string;
      message: string;
      severity: 'error' | 'warning';
      field?: string;
    }>;
    missingRequirements: string[];
    warnings: string[];
  };

  @ManyToOne(() => Horse)
  @JoinColumn({ name: 'horseId' })
  horse!: Horse;

  @Column()
  @Index()
  horseId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserEntity;

  @Column()
  @Index()
  createdById!: string;

  @Column('jsonb', { nullable: true })
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Deal> = {}) {
    Object.assign(this, partial);
  }

  // Helper methods
  canTransitionTo(targetStage: DealStage): boolean {
    const stageOrder = [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.EVALUATION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ];

    const currentIndex = stageOrder.indexOf(this.stage);
    const targetIndex = stageOrder.indexOf(targetStage);

    // Only allow moving one step forward or backward
    return Math.abs(targetIndex - currentIndex) <= 1;
  }

  canChangeStatusTo(targetStatus: DealStatus): boolean {
    const allowedTransitions: Record<DealStatus, DealStatus[]> = {
      [DealStatus.ACTIVE]: [DealStatus.ON_HOLD, DealStatus.CANCELLED, DealStatus.COMPLETED],
      [DealStatus.ON_HOLD]: [DealStatus.ACTIVE, DealStatus.CANCELLED],
      [DealStatus.CANCELLED]: [],
      [DealStatus.COMPLETED]: [],
      [DealStatus.INACTIVE]: [],
      [DealStatus.PENDING]: [DealStatus.ACTIVE, DealStatus.CANCELLED]
    };

    return allowedTransitions[this.status]?.includes(targetStatus) || false;
  }

  hasMetRequirements(stage: DealStage): boolean {
    const requirements = this.stageRequirements[stage];
    if (!requirements) return true;

    // Check documents
    const hasRequiredDocs = requirements.documents
      .filter(doc => doc.required)
      .every(doc =>
        this.documents.some(d =>
          d.type === doc.type &&
          d.status === 'approved'
        )
      );

    // Check participants
    const hasRequiredParticipants = requirements.participants
      .filter(p => p.required)
      .every(p =>
        this.participants.some(participant =>
          participant.role === p.role &&
          participant.status === 'active'
        )
      );

    // Check conditions
    const hasMetConditions = requirements.conditions
      .every(condition => condition.met);

    return hasRequiredDocs && hasRequiredParticipants && hasMetConditions;
  }

  getRequiredParticipants(): ParticipantRole[] {
    switch (this.type) {
      case DealType.FULL_SALE:
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
      case DealType.LEASE:
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
      case DealType.PARTNERSHIP:
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
      case DealType.BREEDING:
        return [ParticipantRole.SELLER, ParticipantRole.VETERINARIAN];
      case DealType.TRAINING:
        return [ParticipantRole.SELLER, ParticipantRole.TRAINER];
      default:
        return [ParticipantRole.SELLER, ParticipantRole.BUYER];
    }
  }

  getMissingParticipants(): ParticipantRole[] {
    const required = new Set(this.getRequiredParticipants());
    const current = new Set(this.participants.map(p => p.role));
    return Array.from(required).filter(role => !current.has(role));
  }
}