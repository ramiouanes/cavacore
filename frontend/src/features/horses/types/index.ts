// src/features/horses/types/index.ts

export type UploadProgressCallback = (progress: number) => void;

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

export interface PedigreeEntry {
  id: string;
  name: string;
  breed: string;
  achievements?: string;
  notes?: string;
}

export interface HorseBasicInfo {
  name: string;
  breed: string;
  dateOfBirth: string | Date;
  gender: HorseGender;
  height: number;
  color: string;
}

export interface MediaItem {
  id?: string;
  file?: File;
  url?: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  caption?: string;
  isMain?: boolean;
  preview?: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface HorsePerformance {
  disciplines: string[];
  currentLevel: DisciplineLevel;
  trainingHistory: string;
  achievements: Achievement[];
}

export interface Vaccination {
  id: string;
  type: string;
  date: string;
  nextDueDate: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  veterinarian: string;
}

export interface VetRecordFile {
  file?: File;
  url?: string;
  originalName: string;
  preview?: string;
}

export interface VetRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  files: VetRecordFile[];
}

export interface HorseHealth {
  generalHealth: string;
  vaccinations: Vaccination[];
  medicalRecords: MedicalRecord[];
  vetRecords: VetRecord[];
  insuranceInfo?: string;
  specialCare?: string;
}

export interface HorseLineage {
  registrationNumber: string;
  passportNumber?: string;
  sire: PedigreeEntry;
  dam: PedigreeEntry;
  breedingHistory?: string;
  bloodlineNotes?: string;
}

export interface Horse {
  id?: string;
  basicInfo: HorseBasicInfo;
  media: MediaItem[];
  performance: HorsePerformance;
  health: HorseHealth;
  lineage: HorseLineage;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  isWishlisted?: boolean;
}

export interface HorseCreateResponse {
  id: string;
  message: string;
}

export interface HorseSearchParams {
  page?: number;
  limit?: number;
  breed?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  discipline?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  searchQuery?: string;
}

export interface FileUploadResponse {
  url: string;
  thumbnailUrl?: string;
  metadata: {
    originalName: string;
    mimeType: string;
    size: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}