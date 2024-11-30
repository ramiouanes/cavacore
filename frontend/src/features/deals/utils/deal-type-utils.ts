import { DealType, DealStage, ParticipantRole } from '../types/deal.types';

interface DealTypeConfig {
  title: string;
  description: string;
  requiredRoles: ParticipantRole[];
  recommendedRoles: ParticipantRole[];
  requiredDocuments: string[];
  recommendedDocuments: string[];
  stages: DealStage[];
  requiredFields: string[];
  validations: Record<string, (value: any) => string | undefined>;
  processingSteps: string[];
  stageRequirements: Record<DealStage, {
    documents: string[];
    participants: ParticipantRole[];
    conditions: string[];
    validations: string[];
  }>;
}

export const dealTypeConfigs: Record<DealType, DealTypeConfig> = {
  [DealType.FULL_SALE]: {
    title: 'Full Sale',
    description: 'Complete transfer of horse ownership',
    requiredRoles: [
      ParticipantRole.SELLER,
      ParticipantRole.BUYER
    ],
    recommendedRoles: [
      ParticipantRole.VETERINARIAN,
      ParticipantRole.INSPECTOR,
      ParticipantRole.TRANSPORTER
    ],
    requiredDocuments: [
      'Bill of Sale',
      'Transfer of Ownership',
      'Veterinary Report',
      'Insurance Certificate'
    ],
    recommendedDocuments: [
      'Medical History',
      'Performance Records',
      'Registration Papers',
      'Competition History'
    ],
    stages: [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.EVALUATION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ],
    requiredFields: [
      'terms.price',
      'terms.conditions',
      'logistics.transportation',
      'logistics.insurance'
    ],
    validations: {
      'terms.price': (value) => 
        !value || value <= 0 ? 'Price must be a positive number' : undefined,
      'logistics.insurance': (value) =>
        !value?.provider ? 'Insurance provider is required' : undefined
    },
    processingSteps: [
      'Initial agreement on price and terms',
      'Veterinary inspection',
      'Insurance arrangement',
      'Document preparation',
      'Payment processing',
      'Ownership transfer'
    ],
    stageRequirements: {
      [DealStage.INITIATION]: {
        documents: ['Intent to Sell'],
        participants: [ParticipantRole.SELLER],
        conditions: ['Initial price agreement'],
        validations: ['terms.price']
      },
      [DealStage.DISCUSSION]: {
        documents: ['Terms Sheet', 'Horse Description'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Terms negotiation complete', 'Price agreement'],
        validations: ['terms.conditions']
      },
      [DealStage.EVALUATION]: {
        documents: ['Veterinary Report', 'Inspection Report'],
        participants: [ParticipantRole.VETERINARIAN, ParticipantRole.INSPECTOR],
        conditions: ['Inspection completed', 'Health verification', 'Performance evaluation'],
        validations: ['logistics.inspection']
      },
      [DealStage.DOCUMENTATION]: {
        documents: ['Bill of Sale', 'Transfer of Ownership', 'Insurance Certificate'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['All documents prepared', 'Insurance arranged'],
        validations: ['logistics.insurance']
      },
      [DealStage.CLOSING]: {
        documents: ['Signed Contract', 'Payment Confirmation'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Payment processed', 'Documents signed', 'Transport arranged'],
        validations: ['logistics.transportation']
      },
      [DealStage.COMPLETE]: {
        documents: ['Final Transfer of Ownership'],
        participants: [],
        conditions: ['Ownership transferred', 'Registration updated'],
        validations: []
      }
    }
  },

  [DealType.LEASE]: {
    title: 'Lease Agreement',
    description: 'Temporary use arrangement',
    requiredRoles: [
      ParticipantRole.SELLER,
      ParticipantRole.BUYER
    ],
    recommendedRoles: [
      ParticipantRole.VETERINARIAN,
      ParticipantRole.TRAINER
    ],
    requiredDocuments: [
      'Lease Agreement',
      'Insurance Certificate',
      'Condition Report'
    ],
    recommendedDocuments: [
      'Training Schedule',
      'Maintenance Requirements',
      'Usage Guidelines'
    ],
    stages: [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE,
      DealStage.EVALUATION
    ],
    requiredFields: [
      'terms.duration',
      'terms.startDate',
      'terms.endDate',
      'terms.conditions'
    ],
    validations: {
      'terms.duration': (value) =>
        !value || value <= 0 ? 'Duration must be specified' : undefined,
      'terms.startDate': (value) =>
        !value ? 'Start date is required' : undefined
    },
    processingSteps: [
      'Agreement on lease terms',
      'Condition documentation',
      'Insurance verification',
      'Schedule arrangement',
      'Document signing'
    ],
    stageRequirements: {
      [DealStage.INITIATION]: {
        documents: ['Draft Lease Terms'],
        participants: [ParticipantRole.SELLER],
        conditions: ['Initial lease terms proposed'],
        validations: ['terms.duration']
      },
      [DealStage.DISCUSSION]: {
        documents: ['Draft Lease Agreement'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Terms negotiation complete', 'Usage terms agreed'],
        validations: ['terms.conditions']
      },
      [DealStage.EVALUATION]: {
        documents: ['Current Health Certificate', 'Condition Report'],
        participants: [ParticipantRole.VETERINARIAN],
        conditions: ['Health check completed', 'Current condition documented'],
        validations: []
      },
      [DealStage.DOCUMENTATION]: {
        documents: ['Lease Agreement', 'Insurance Certificate', 'Care Guidelines'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['All documents reviewed'],
        validations: ['logistics.insurance']
      },
      [DealStage.CLOSING]: {
        documents: ['Signed Lease', 'Payment Schedule', 'Handover Checklist'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['All signatures obtained', 'Initial payment confirmed'],
        validations: []
      },
      [DealStage.COMPLETE]: {
        documents: ['Final Condition Report'],
        participants: [],
        conditions: ['Lease commenced'],
        validations: []
      }
    }
  },

  [DealType.BREEDING]: {
    title: 'Breeding Contract',
    description: 'Breeding rights agreement',
    requiredRoles: [
      ParticipantRole.SELLER,
      ParticipantRole.BUYER,
      ParticipantRole.VETERINARIAN
    ],
    recommendedRoles: [
      ParticipantRole.INSPECTOR
    ],
    requiredDocuments: [
      'Breeding Contract',
      'Health Certificate',
      'Registration Papers'
    ],
    recommendedDocuments: [
      'Genetic Testing Results',
      'Performance Records',
      'Breeding History'
    ],
    stages: [
      DealStage.INITIATION,
      DealStage.EVALUATION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ],
    requiredFields: [
      'terms.conditions',
      'terms.startDate',
      'logistics.location'
    ],
    validations: {
      'terms.conditions': (value) =>
        !value || !Array.isArray(value) || value.length === 0
          ? 'Breeding conditions must be specified'
          : undefined
    },
    processingSteps: [
      'Health verification',
      'Breeding terms agreement',
      'Schedule coordination',
      'Document preparation',
      'Contract signing'
    ],
    stageRequirements: {
      [DealStage.INITIATION]: {
        documents: ['Breeding Terms Proposal'],
        participants: [ParticipantRole.SELLER, ParticipantRole.VETERINARIAN],
        conditions: ['Initial breeding terms defined'],
        validations: ['terms.startDate']
      },
      [DealStage.DISCUSSION]: {
        documents: ['Draft Partnership Agreement', 'Management Structure'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Partner roles defined', 'Financial terms agreed'],
        validations: ['terms.conditions']
      },
      [DealStage.EVALUATION]: {
        documents: ['Health Certificate', 'Breeding Soundness Exam'],
        participants: [ParticipantRole.VETERINARIAN],
        conditions: ['Health verified', 'Breeding soundness confirmed'],
        validations: []
      },
      [DealStage.DOCUMENTATION]: {
        documents: ['Breeding Contract', 'Live Foal Guarantee', 'Health Records'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Breeding terms finalized'],
        validations: ['terms.conditions']
      },
      [DealStage.CLOSING]: {
        documents: ['Signed Contract', 'Payment Receipt', 'Breeding Schedule'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Contract signed', 'Payment received'],
        validations: ['logistics.schedule']
      },
      [DealStage.COMPLETE]: {
        documents: ['Breeding Confirmation'],
        participants: [],
        conditions: ['Breeding completed'],
        validations: []
      }
    }
  },

  [DealType.PARTNERSHIP]: {
    title: 'Partnership Agreement',
    description: 'Shared ownership arrangement',
    requiredRoles: [
      ParticipantRole.SELLER,
      ParticipantRole.BUYER
    ],
    recommendedRoles: [
      ParticipantRole.TRAINER,
      ParticipantRole.VETERINARIAN
    ],
    requiredDocuments: [
      'Partnership Agreement',
      'Financial Terms',
      'Insurance Policy'
    ],
    recommendedDocuments: [
      'Management Plan',
      'Cost Sharing Agreement',
      'Exit Strategy'
    ],
    stages: [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.DOCUMENTATION,
      DealStage.CLOSING,
      DealStage.COMPLETE
    ],
    requiredFields: [
      'terms.conditions',
      'terms.financialTerms',
      'logistics.management'
    ],
    validations: {
      'terms.conditions': (value) =>
        !value || !Array.isArray(value) || value.length === 0
          ? 'Partnership terms must be specified'
          : undefined
    },
    processingSteps: [
      'Terms negotiation',
      'Financial planning',
      'Management structure',
      'Document preparation',
      'Partnership execution'
    ],
    stageRequirements: {
      [DealStage.INITIATION]: {
        documents: ['Partnership Proposal', 'Financial Overview'],
        participants: [ParticipantRole.SELLER],
        conditions: ['Initial partnership terms defined', 'Financial structure proposed'],
        validations: ['terms.financialTerms']
      },
      [DealStage.DISCUSSION]: {
        documents: ['Draft Partnership Agreement', 'Management Structure'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Partner roles defined', 'Financial terms agreed'],
        validations: ['terms.conditions']
      },
      [DealStage.EVALUATION]: {
        documents: ['Veterinary Report', 'Inspection Report'],
        participants: [ParticipantRole.VETERINARIAN, ParticipantRole.INSPECTOR],
        conditions: ['Inspection completed', 'Health verification', 'Performance evaluation'],
        validations: ['logistics.inspection']
      },
      [DealStage.DOCUMENTATION]: {
        documents: ['Partnership Agreement', 'Financial Terms', 'Insurance Policy', 'Management Plan'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['Management structure defined', 'Exit strategy documented'],
        validations: ['logistics.management']
      },
      [DealStage.CLOSING]: {
        documents: ['Signed Partnership Agreement', 'Payment Confirmation', 'Bank Account Setup'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['All agreements signed', 'Initial contributions received', 'Operational structure confirmed'],
        validations: []
      },
      [DealStage.COMPLETE]: {
        documents: ['Final Partnership Registration'],
        participants: [],
        conditions: ['Partnership activated', 'Management transition complete'],
        validations: []
      }
    }
  },

  [DealType.TRAINING]: {
    title: 'Training Agreement',
    description: 'Professional training arrangement',
    requiredRoles: [
      ParticipantRole.SELLER,
      ParticipantRole.TRAINER
    ],
    recommendedRoles: [
      ParticipantRole.VETERINARIAN
    ],
    requiredDocuments: [
      'Training Agreement',
      'Liability Release',
      'Goals Document'
    ],
    recommendedDocuments: [
      'Training Schedule',
      'Progress Metrics',
      'Health Requirements'
    ],
    stages: [
      DealStage.INITIATION,
      DealStage.DISCUSSION,
      DealStage.DOCUMENTATION,
      DealStage.COMPLETE
    ],
    requiredFields: [
      'terms.duration',
      'terms.startDate',
      'terms.goals'
    ],
    validations: {
      'terms.duration': (value) =>
        !value || value <= 0 ? 'Training duration must be specified' : undefined,
      'terms.goals': (value) =>
        !value || !Array.isArray(value) || value.length === 0
          ? 'Training goals must be specified'
          : undefined
    },
    processingSteps: [
      'Goals definition',
      'Schedule planning',
      'Terms agreement',
      'Document preparation',
      'Program initiation'
    ],
    stageRequirements: {
      [DealStage.INITIATION]: {
        documents: ['Training Program Proposal'],
        participants: [ParticipantRole.SELLER, ParticipantRole.TRAINER],
        conditions: ['Initial goals defined', 'Training approach outlined'],
        validations: ['terms.goals']
      },
      [DealStage.DISCUSSION]: {
        documents: ['Draft Training Agreement', 'Goals Document'],
        participants: [ParticipantRole.SELLER, ParticipantRole.TRAINER],
        conditions: ['Training schedule agreed', 'Performance metrics defined'],
        validations: ['terms.duration']
      },
      [DealStage.EVALUATION]: {
        documents: ['Veterinary Report', 'Inspection Report'],
        participants: [ParticipantRole.VETERINARIAN, ParticipantRole.INSPECTOR],
        conditions: ['Inspection completed', 'Health verification', 'Performance evaluation'],
        validations: ['logistics.inspection']
      },
      [DealStage.DOCUMENTATION]: {
        documents: ['Training Agreement', 'Liability Release', 'Health Requirements'],
        participants: [ParticipantRole.SELLER, ParticipantRole.TRAINER, ParticipantRole.VETERINARIAN],
        conditions: ['Health clearance obtained', 'Training facility confirmed'],
        validations: ['terms.startDate']
      },
      [DealStage.CLOSING]: {
        documents: ['Signed Partnership Agreement', 'Payment Confirmation', 'Bank Account Setup'],
        participants: [ParticipantRole.SELLER, ParticipantRole.BUYER],
        conditions: ['All agreements signed', 'Initial contributions received', 'Operational structure confirmed'],
        validations: []
      },
      [DealStage.COMPLETE]: {
        documents: ['Training Commencement Report'],
        participants: [],
        conditions: ['Training program initiated', 'Initial assessment completed'],
        validations: []
      }
    }
  }
};

/**
 * Utility functions for deal type specific operations
 */
export const dealTypeUtils = {
  getConfig(type: DealType): DealTypeConfig {
    return dealTypeConfigs[type];
  },

  getStageRequirements(type: DealType, stage: DealStage) {
    const config = dealTypeConfigs[type];
    return config.stageRequirements[stage] || {
      documents: [],
      participants: [],
      conditions: [],
      validations: []
    };
  },

  validateStageRequirements(
    type: DealType, 
    stage: DealStage, 
    dealData: any
  ): { 
    isValid: boolean;
    missingRequirements: string[];
  } {
    const requirements = this.getStageRequirements(type, stage);
    const missingRequirements: string[] = [];
    
    // Check documents
    requirements.documents.forEach(doc => {
      if (!dealData.documents?.some((d: { type: string; status: string }) => d.type === doc && d.status === 'approved')) {
        missingRequirements.push(`Missing document: ${doc}`);
      }
    });

    // Check participants
    requirements.participants.forEach(role => {
      if (!dealData.participants?.some((p: { role: ParticipantRole; status: string }) => p.role === role && p.status === 'active')) {
        missingRequirements.push(`Missing participant: ${role}`);
      }
    });

    // Check conditions and validations
    const config = this.getConfig(type);
    requirements.validations.forEach(field => {
      const validator = config.validations[field];
      if (validator) {
        const value = field.split('.').reduce((obj, key) => obj?.[key], dealData);
        const error = validator(value);
        if (error) {
          missingRequirements.push(error);
        }
      }
    });

    return {
      isValid: missingRequirements.length === 0,
      missingRequirements
    };
  },

  getRequiredDocuments(type: DealType): string[] {
    return dealTypeConfigs[type].requiredDocuments;
  },

  validateDealType(type: DealType, data: any): string[] {
    const config = dealTypeConfigs[type];
    const errors: string[] = [];

    // Validate required fields
    config.requiredFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], data);
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required for ${config.title}`);
      }
    });

    // Validate using type-specific validation rules
    Object.entries(config.validations).forEach(([field, validator]) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], data);
      const error = validator(value);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  },

  getNextSteps(type: DealType, currentStage: DealStage): string[] {
    const config = dealTypeConfigs[type];
    const currentIndex = config.stages.indexOf(currentStage);
    
    if (currentIndex === -1 || currentIndex === config.stages.length - 1) {
      return [];
    }

    const nextStage = config.stages[currentIndex + 1];
    return [
      `Complete current ${currentStage} stage requirements`,
      `Prepare for ${nextStage} stage`,
      ...config.processingSteps.slice(currentIndex + 1, currentIndex + 3)
    ];
  },

  getParticipantRequirements(type: DealType): {
    required: ParticipantRole[];
    recommended: ParticipantRole[];
  } {
    const config = dealTypeConfigs[type];
    return {
      required: config.requiredRoles,
      recommended: config.recommendedRoles
    };
  }
};