import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum HorseGender {
  MARE = 'mare',
  STALLION = 'stallion',
  GELDING = 'gelding'
}

export enum DisciplineLevel {
  BEGINNER = 'beginner',
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional'
}

@Entity('horses')
export class Horse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'basicInfo', type: 'jsonb' })
  basicInfo!: {
    name: string;
    breed: string;
    dateOfBirth: Date;
    gender: HorseGender;
    height: number; // in hands
    color: string;
  };

  @Column('jsonb')
  media!: Array<{
    url: string;
    thumbnailUrl?: string;
    type: 'image' | 'video';
    caption?: string;
    isMain: boolean;
  }>;

  @Column('jsonb')
  performance!: {
    disciplines: string[];
    currentLevel: DisciplineLevel;
    trainingHistory: string;
    achievements: Array<{
      id: string;
      title: string;
      date: Date;
      description: string;
    }>;
  };

  @Column('jsonb')
  health!: {
    generalHealth: string;
    vaccinations: Array<{
      id: string;
      type: string;
      date: Date;
      nextDueDate: Date;
      notes?: string;
    }>;
    medicalRecords: Array<{
      id: string;
      date: Date;
      type: string;
      description: string;
      veterinarian: string;
    }>;
    vetRecords: Array<{
      id: string;
      date: Date;
      type: string;
      description: string;
      files: Array<{
        url: string;
        originalName: string;
      }>;
    }>;
    insuranceInfo?: string;
    specialCare?: string;
  };

  @Column('jsonb')
  lineage!: {
    registrationNumber: string;
    passportNumber?: string;
    sire: {
      id: string;
      name: string;
      breed: string;
      achievements?: string;
      notes?: string;
    };
    dam: {
      id: string;
      name: string;
      breed: string;
      achievements?: string;
      notes?: string;
    };
    breedingHistory?: string;
    bloodlineNotes?: string;
  };

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner!: UserEntity;

  @Column()
  @Index()
  ownerId!: string;

  @Column({ default: 'active' })
  @Index()
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual fields (not stored in DB)
  views?: number;
  isWishlisted?: boolean;
}