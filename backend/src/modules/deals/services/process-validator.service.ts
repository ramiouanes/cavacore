import { Injectable } from '@nestjs/common';
import { Deal, DealStage, DealStatus, ParticipantRole } from '../entities/deal.entity';
import { FileLogger } from '../../../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingRequirements: string[];
  suggestions: string[];
  blockingConditions?: string[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'critical';
  metadata?: Record<string, any>;
}

interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
  metadata?: Record<string, any>;
}

interface StageRequirement {
  id: string;
  type: 'document' | 'participant' | 'approval' | 'condition';
  description: string;
  validationFn: (deal: Deal) => boolean | Promise<boolean>;
  errorMessage: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ProcessValidator {
  private logger = FileLogger.getInstance();
  private stageRequirements: Map<DealStage, StageRequirement[]> = new Map();

  constructor() {
    this.initializeStageRequirements();
  }

  private initializeStageRequirements() {
    // Initiation Stage
    this.stageRequirements.set(DealStage.INITIATION, [
      {
        id: 'init_basic_info',
        type: 'condition',
        description: 'Basic deal information must be complete',
        validationFn: (deal) => !!deal.basicInfo.horseId && !!deal.type,
        errorMessage: 'Missing basic deal information'
      },
      {
        id: 'init_participants',
        type: 'participant',
        description: 'Must have seller and buyer/agent',
        validationFn: (deal) => this.validateRequiredParticipants(deal),
        errorMessage: 'Missing required participants'
      },
      {
        id: 'init_terms',
        type: 'condition',
        description: 'Basic terms must be defined',
        validationFn: (deal) => !!deal.terms,
        errorMessage: 'Basic terms not defined'
      }
    ]);

    // Discussion Stage
    this.stageRequirements.set(DealStage.DISCUSSION, [
      {
        id: 'disc_terms',
        type: 'condition',
        description: 'Detailed terms must be defined',
        validationFn: (deal) => this.validateTermsDefinition(deal),
        errorMessage: 'Terms not properly defined'
      },
      {
        id: 'disc_price',
        type: 'condition',
        description: 'Price must be specified',
        validationFn: (deal) => !!deal.terms?.price && deal.terms.price > 0,
        errorMessage: 'Valid price not specified'
      }
    ]);

    // Evaluation Stage
    this.stageRequirements.set(DealStage.EVALUATION, [
      {
        id: 'eval_inspection',
        type: 'condition',
        description: 'Inspection must be scheduled',
        validationFn: (deal) => !!deal.logistics?.inspection?.date,
        errorMessage: 'Inspection not scheduled'
      },
      {
        id: 'eval_inspector',
        type: 'participant',
        description: 'Inspector must be assigned',
        validationFn: (deal) => deal.participants.some(p => p.role === ParticipantRole.INSPECTOR),
        errorMessage: 'Inspector not assigned'
      }
    ]);

    // Documentation Stage
    this.stageRequirements.set(DealStage.DOCUMENTATION, [
      {
        id: 'doc_contract',
        type: 'document',
        description: 'Contract must be uploaded',
        validationFn: (deal) => this.validateContractDocument(deal),
        errorMessage: 'Contract document missing or not approved'
      },
      {
        id: 'doc_inspection',
        type: 'document',
        description: 'Inspection report must be uploaded',
        validationFn: (deal) => deal.documents.some(doc => 
          doc.type === 'inspection_report' && doc.status === 'approved'
        ),
        errorMessage: 'Inspection report missing or not approved'
      },
      {
        id: 'doc_insurance',
        type: 'condition',
        description: 'Insurance details must be provided',
        validationFn: (deal) => !!deal.logistics?.insurance?.provider,
        errorMessage: 'Insurance details not provided'
      }
    ]);

    // Closing Stage
    this.stageRequirements.set(DealStage.CLOSING, [
      {
        id: 'close_signed_contract',
        type: 'document',
        description: 'Signed contract must be uploaded',
        validationFn: (deal) => deal.documents.some(doc => 
          doc.type === 'signed_contract' && doc.status === 'approved'
        ),
        errorMessage: 'Signed contract missing or not approved'
      },
      {
        id: 'close_transport',
        type: 'condition',
        description: 'Transportation must be scheduled',
        validationFn: (deal) => !!deal.logistics?.transportation?.date,
        errorMessage: 'Transportation not scheduled'
      },
      {
        id: 'close_approvals',
        type: 'approval',
        description: 'All parties must approve completion',
        validationFn: (deal) => this.validatePartyApprovals(deal),
        errorMessage: 'Missing required approvals'
      }
    ]);

    // Complete Stage
    this.stageRequirements.set(DealStage.COMPLETE, [
      {
        id: 'complete_documents',
        type: 'document',
        description: 'All final documents must be approved',
        validationFn: (deal) => this.validateFinalDocuments(deal),
        errorMessage: 'Missing or unapproved required documents'
      },
      {
        id: 'complete_payment',
        type: 'document',
        description: 'Payment confirmation must be uploaded',
        validationFn: (deal) => deal.documents.some(doc => 
          doc.type === 'payment_confirmation' && doc.status === 'approved'
        ),
        errorMessage: 'Payment confirmation missing or not approved'
      }
    ]);
  }

  async validateDealProcess(deal: Deal): Promise<ValidationResult> {
    try {
      const structuralValidation = await this.validateDealStructure(deal);
      if (!structuralValidation.isValid) {
        return structuralValidation;
      }

      const commonValidation = await this.validateCommonRequirements(deal);
      const stageValidation = await this.validateStageRequirements(deal, deal.stage);
      const blockingConditions = await this.checkBlockingConditions(deal);

      return {
        isValid: stageValidation.isValid && commonValidation.isValid && blockingConditions.length === 0,
        errors: [...stageValidation.errors, ...commonValidation.errors],
        warnings: [...stageValidation.warnings, ...commonValidation.warnings],
        missingRequirements: [...stageValidation.missingRequirements, ...commonValidation.missingRequirements],
        suggestions: [...stageValidation.suggestions, ...commonValidation.suggestions],
        blockingConditions
      };
    } catch (error) {
      this.logger.error('Process validation error', error);
      throw error;
    }
  }

  async validateStageRequirements(deal: Deal, stage: DealStage): Promise<ValidationResult> {
    const requirements = this.stageRequirements.get(stage) || [];
    const errors: ValidationError[] = [];
    const missingRequirements: string[] = [];

    for (const req of requirements) {
      const isValid = await req.validationFn(deal);
      if (!isValid) {
        errors.push({
          code: `MISSING_${req.type.toUpperCase()}`,
          message: req.errorMessage,
          severity: 'error',
          metadata: req.metadata
        });
        missingRequirements.push(req.description);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      missingRequirements,
      suggestions: this.generateSuggestions(errors, [])
    };
  }

  private async validateDealStructure(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];

    if (!deal.basicInfo?.horseId) {
      errors.push({
        code: 'MISSING_HORSE',
        message: 'Deal must reference a horse',
        severity: 'critical'
      });
      missingRequirements.push('Horse reference');
    }

    if (!deal.terms) {
      errors.push({
        code: 'MISSING_TERMS',
        message: 'Deal must have terms defined',
        severity: 'critical'
      });
      missingRequirements.push('Deal terms');
    }

    if (!deal.participants || deal.participants.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_PARTICIPANTS',
        message: 'Deal must have at least 2 participants',
        severity: 'critical'
      });
      missingRequirements.push('Minimum participants');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions: this.generateSuggestions(errors, warnings)
    };
  }

  private async validateCommonRequirements(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];

    if (deal.stage === DealStage.COMPLETE && deal.status !== DealStatus.COMPLETED) {
      errors.push({
        code: 'STATUS_MISMATCH',
        message: 'Completed deals must have COMPLETED status',
        severity: 'error'
      });
    }

    const lastUpdate = new Date(Math.max(
      ...deal.timeline.map(entry => new Date(entry.date).getTime())
    ));
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 30 && deal.status === DealStatus.ACTIVE) {
      warnings.push({
        code: 'STALE_DEAL',
        message: 'Deal has been inactive for over 30 days',
        recommendation: 'Consider updating the deal status or reaching out to participants'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions: this.generateSuggestions(errors, warnings)
    };
  }

  private async checkBlockingConditions(deal: Deal): Promise<string[]> {
    const blockingConditions: string[] = [];

    const inactiveRequired = deal.participants
      .filter(p => ['SELLER', 'BUYER'].includes(p.role))
      .filter(p => p.status !== 'active');

    if (inactiveRequired.length > 0) {
      blockingConditions.push('Required participants are inactive');
    }

    const criticalDocs = deal.documents
      .filter(doc => ['contract', 'transfer_of_ownership'].includes(doc.type))
      .filter(doc => doc.status === 'rejected');

    if (criticalDocs.length > 0) {
      blockingConditions.push('Critical documents have been rejected');
    }

    return blockingConditions;
  }

  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions = new Set<string>();

    errors.forEach(error => {
      switch (error.code) {
        case 'MISSING_HORSE':
          suggestions.add('Add a horse reference to proceed');
          break;
        case 'MISSING_TERMS':
          suggestions.add('Define basic deal terms including price and conditions');
          break;
        case 'INSUFFICIENT_PARTICIPANTS':
          suggestions.add('Add required participants (minimum 2)');
          break;
        case 'MISSING_DOCUMENT':
          suggestions.add('Upload all required documents and ensure they are approved');
          break;
        case 'MISSING_APPROVAL':
          suggestions.add('Obtain necessary approvals from all required parties');
          break;
      }
    });

    warnings.forEach(warning => {
      if (warning.recommendation) {
        suggestions.add(warning.recommendation);
      }
    });

    return Array.from(suggestions);
  }

  // Helper validation methods
  private validateRequiredParticipants(deal: Deal): boolean {
    return deal.participants.some(p => p.role === ParticipantRole.SELLER) &&
      deal.participants.some(p => p.role === ParticipantRole.BUYER || p.role === ParticipantRole.AGENT);
  }

  private validateTermsDefinition(deal: Deal): boolean {
    return !!deal.terms?.price && 
      Array.isArray(deal.terms?.conditions) && 
      deal.terms.conditions.length > 0;
  }

  private validateContractDocument(deal: Deal): boolean {
    return deal.documents.some(doc =>
      doc.type === 'contract' && doc.status === 'approved'
    );
  }

  private validatePartyApprovals(deal: Deal): boolean {
    const requiredRoles = [ParticipantRole.SELLER, ParticipantRole.BUYER];
    return requiredRoles.every(role =>
      deal.participants
        .filter(p => p.role === role)
        .every(p => deal.metadata?.approvals?.includes(p.id))
    );
  }

  private validateFinalDocuments(deal: Deal): boolean {
    const requiredDocs = ['signed_contract', 'transfer_of_ownership', 'payment_confirmation'];
    return requiredDocs.every(docType =>
      deal.documents.some(doc => doc.type === docType && doc.status === 'approved')
    );
  }
}