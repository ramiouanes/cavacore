// src/modules/deals/interfaces/stage-requirements.interface.ts

import { DealStage, DealType, ParticipantRole } from '../entities/deal.entity';

export interface StageRequirement {
  id: string;
  type: RequirementType;
  description: string;
  isRequired: boolean;
  validationFn?: (deal: any) => boolean | Promise<boolean>;
  errorMessage?: string;
  dependsOn?: string[]; // IDs of other requirements
}

export enum RequirementType {
  DOCUMENT = 'document',
  PARTICIPANT = 'participant',
  APPROVAL = 'approval',
  PAYMENT = 'payment',
  INSPECTION = 'inspection',
  SIGNATURE = 'signature',
  CUSTOM = 'custom',
  CONDITION = 'condition'
}

export interface StageConfiguration {
  stage: DealStage;
  requirements: StageRequirement[];
  allowedRoles: ParticipantRole[];
  minimumTimeInStage?: number; // in hours
  maximumTimeInStage?: number; // in hours
  autoProgressOn?: StageRequirement[]; // Requirements that trigger automatic progression
  notifyOnEnter?: ParticipantRole[];
  notifyOnExit?: ParticipantRole[];
}

export interface DealTypeStageConfig {
  dealType: DealType;
  stages: Record<DealStage, StageConfiguration>;
  defaultStage: DealStage;
  allowedTransitions: {
    [key in DealStage]?: DealStage[];
  };
}

export const DEFAULT_STAGE_REQUIREMENTS: Record<RequirementType, Partial<StageRequirement>> = {
  [RequirementType.DOCUMENT]: {
    isRequired: true,
    errorMessage: 'Required document not uploaded'
  },
  [RequirementType.PARTICIPANT]: {
    isRequired: true,
    errorMessage: 'Required participant not added'
  },
  [RequirementType.APPROVAL]: {
    isRequired: true,
    errorMessage: 'Required approval not obtained'
  },
  [RequirementType.PAYMENT]: {
    isRequired: true,
    errorMessage: 'Required payment not completed'
  },
  [RequirementType.INSPECTION]: {
    isRequired: true,
    errorMessage: 'Required inspection not completed'
  },
  [RequirementType.SIGNATURE]: {
    isRequired: true,
    errorMessage: 'Required signature not obtained'
  },
  [RequirementType.CUSTOM]: {
    isRequired: false,
    errorMessage: 'Custom requirement not met'
  },
  [RequirementType.CONDITION]: {
    isRequired: false,
    errorMessage: 'Condition not met'
  }
};

export interface RequirementValidationResult {
  requirementId: string;
  isValid: boolean;
  message?: string;
  details?: Record<string, any>;
}

export interface StageValidationContext {
  currentStage: DealStage;
  targetStage: DealStage;
  dealType: DealType;
  requirements: RequirementValidationResult[];
  canProgress: boolean;
  blockers: string[];
  recommendations: string[];
}

export interface StageTransitionResult {
  success: boolean;
  newStage?: DealStage;
  validationContext?: StageValidationContext;
  error?: string;
  completedRequirements: string[];
  pendingRequirements: string[];
}