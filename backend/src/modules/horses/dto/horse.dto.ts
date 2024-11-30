// backend/src/modules/horses/dto/horse.dto.ts

import { 
  IsString,
  IsOptional,
} from 'class-validator';

// We'll create a simplified DTO for the multipart form data
export class CreateHorseDto {
  @IsString()
  basicInfo!: string; // Will be stringified JSON

  @IsString()
  media!: string; // Will be stringified JSON

  @IsString()
  performance!: string; // Will be stringified JSON

  @IsString()
  health!: string; // Will be stringified JSON

  @IsString()
  lineage!: string; // Will be stringified JSON
}

// Create separate interfaces for the parsed data
export interface HorseBasicInfo {
  name: string;
  breed: string;
  dateOfBirth: Date;
  gender: string;
  height: number;
  color: string;
}

export interface HorseMedia {
  type: 'image' | 'video';
  caption?: string;
  isMain: boolean;
}

export interface HorsePerformance {
  disciplines: string[];
  currentLevel: string;
  trainingHistory: string;
  achievements: Array<{
    id: string;
    title: string;
    date: Date;
    description: string;
  }>;
}

export interface HorseHealth {
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
      url?: string;
      originalName: string;
    }>;
  }>;
  insuranceInfo?: string;
  specialCare?: string;
}

export interface HorseLineage {
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
}

export interface ParsedHorseData {
  basicInfo: HorseBasicInfo;
  media: HorseMedia[];
  performance: HorsePerformance;
  health: HorseHealth;
  lineage: HorseLineage;
}

export class UpdateHorseDto extends CreateHorseDto {}