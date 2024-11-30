import { Injectable } from '@nestjs/common';
import { Deal, DealStage, DealStatus, ParticipantRole } from '../entities/deal.entity';
import { FileLogger } from '../../../utils/logger';
import { DealDocument, DealParticipant } from '../dto/deal.dto';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingRequirements: string[];
  suggestions: string[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'critical';
}

interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

interface DocumentValidationFeedback {
  documentId: string;
  status: 'error' | 'warning' | 'success';
  message: string;
  details?: string[];
  suggestions?: string[];
}

@Injectable()
export class ProcessValidator {
  private logger = FileLogger.getInstance();

  private stageValidators = new Map<DealStage, (deal: Deal) => Promise<ValidationResult>>([
    [DealStage.INITIATION, this.validateInitiationStage.bind(this)],
    [DealStage.DISCUSSION, this.validateDiscussionStage.bind(this)],
    [DealStage.EVALUATION, this.validateEvaluationStage.bind(this)],
    [DealStage.DOCUMENTATION, this.validateDocumentationStage.bind(this)],
    [DealStage.CLOSING, this.validateClosingStage.bind(this)],
    [DealStage.COMPLETE, this.validateCompleteStage.bind(this)]
  ]);

  async validateDealProcess(deal: any): Promise<ValidationResult> {
    try {
      this.logger.log('Validating deal process', { dealId: deal.basicInfo.id, stage: deal.stage });

      // Validate basic deal structure
      const structuralValidation = await this.validateDealStructure(deal);
      if (!structuralValidation.isValid) {
        return structuralValidation;
      }

      // Get stage-specific validator
      const stageValidator = this.stageValidators.get(deal.stage);
      if (!stageValidator) {
        return {
          isValid: false,
          errors: [{
            code: 'INVALID_STAGE',
            message: `Invalid deal stage: ${deal.stage}`,
            severity: 'critical'
          }],
          warnings: [],
          missingRequirements: [],
          suggestions: []
        };
      }

      // Perform stage-specific validation
      const stageValidation = await stageValidator(deal);

      // Combine with common validations
      const commonValidation = await this.validateCommonRequirements(deal);

      return this.combineValidationResults(stageValidation, commonValidation);
    } catch (error) {
      this.logger.error('Process validation error', error);
      throw error;
    }
  }

  private async validateDealStructure(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!deal.basicInfo.horseId) {
      errors.push({
        code: 'MISSING_HORSE',
        message: 'Deal must reference a horse',
        severity: 'critical'
      });
    }

    if (!deal.terms) {
      errors.push({
        code: 'MISSING_TERMS',
        message: 'Deal must have terms defined',
        severity: 'critical'
      });
    }

    // Validate participants
    if (!deal.participants || deal.participants.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_PARTICIPANTS',
        message: 'Deal must have at least 2 participants',
        severity: 'critical'
      });
    } else {
      const hasRequiredRoles = this.validateRequiredRoles(deal.participants);
      if (!hasRequiredRoles.isValid) {
        errors.push({
          code: 'MISSING_REQUIRED_ROLES',
          message: hasRequiredRoles.message,
          severity: 'critical'
        });
      }
    }

    // Timeline validation
    if (!deal.timeline || deal.timeline.length === 0) {
      warnings.push({
        code: 'EMPTY_TIMELINE',
        message: 'Deal has no timeline entries',
        recommendation: 'Consider initializing the timeline with a creation entry'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements: [],
      suggestions: []
    };
  }

  private async validateCommonRequirements(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate status consistency
    if (deal.stage === DealStage.COMPLETE && deal.status !== DealStatus.COMPLETED) {
      errors.push({
        code: 'STATUS_MISMATCH',
        message: 'Completed deals must have COMPLETED status',
        severity: 'error'
      });
    }

    // Check for stale deals
    const lastUpdate = new Date(Math.max(
      ...deal.timeline.map(entry => entry.date.getTime())
    ));
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 30 && deal.status === DealStatus.ACTIVE) {
      warnings.push({
        code: 'STALE_DEAL',
        message: 'Deal has been inactive for over 30 days',
        recommendation: 'Consider updating the deal status or reaching out to participants'
      });
    }

    // Validate document consistency
    const documentValidation = this.validateDocuments(deal);
    errors.push(...documentValidation.errors);
    warnings.push(...documentValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements: [],
      suggestions
    };
  }

  private async validateInitiationStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate basic terms
    if (!deal.terms.price) {
      missingRequirements.push('Initial price requirement');
    }

    // Check participant readiness
    const participantValidation = this.validateParticipantReadiness(deal);
    if (!participantValidation.isValid) {
      errors.push(...participantValidation.errors);
      warnings.push(...participantValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private async validateDiscussionStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate terms completeness
    if (!deal.terms.conditions || deal.terms.conditions.length === 0) {
      missingRequirements.push('Deal conditions');
    }

    // Check for required documents
    if (!deal.documents.some(doc => doc.type === 'terms_agreement')) {
      missingRequirements.push('Terms agreement document');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private async validateEvaluationStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate inspection requirements
    if (!deal.logistics?.inspection) {
      errors.push({
        code: 'MISSING_INSPECTION',
        message: 'Inspection details are required for evaluation stage',
        severity: 'error'
      });
    }

    // Check for required documents
    const requiredDocs = ['inspection_report', 'veterinary_report'];
    requiredDocs.forEach(docType => {
      if (!deal.documents.some(doc => doc.type === docType)) {
        missingRequirements.push(`${docType.replace('_', ' ')} document`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private async validateDocumentationStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate required documentation
    const requiredDocs = [
      'contract_draft',
      'insurance_certificate',
      'terms_agreement'
    ];

    requiredDocs.forEach(docType => {
      if (!deal.documents.some(doc => doc.type === docType && doc.status === 'approved')) {
        missingRequirements.push(`Approved ${docType.replace('_', ' ')}`);
      }
    });

    // Insurance validation
    if (!deal.logistics?.insurance) {
      errors.push({
        code: 'MISSING_INSURANCE',
        message: 'Insurance details are required for documentation stage',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private async validateClosingStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate signed documents
    if (!deal.documents.some(doc => 
      doc.type === 'signed_contract' && 
      doc.status === 'approved'
    )) {
      errors.push({
        code: 'MISSING_SIGNED_CONTRACT',
        message: 'Approved signed contract is required for closing stage',
        severity: 'error'
      });
    }

    // Validate logistics
    if (!deal.logistics?.transportation) {
      missingRequirements.push('Transportation arrangements');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private async validateCompleteStage(deal: Deal): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequirements: string[] = [];
    const suggestions: string[] = [];

    // Validate completion requirements
    const requiredDocs = [
      'signed_contract',
      'transfer_of_ownership',
      'payment_confirmation'
    ];

    requiredDocs.forEach(docType => {
      if (!deal.documents.some(doc => 
        doc.type === docType && 
        doc.status === 'approved'
      )) {
        errors.push({
          code: `MISSING_${docType.toUpperCase()}`,
          message: `Approved ${docType.replace('_', ' ')} is required for completion`,
          severity: 'error'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements,
      suggestions
    };
  }

  private validateRequiredRoles(participants: Deal['participants']): { 
    isValid: boolean; 
    message: string; 
  } {
    const roles = participants.map(p => p.role);
    const hasRequiredRoles = 
      roles.includes(ParticipantRole.SELLER) && 
      (roles.includes(ParticipantRole.BUYER) || roles.includes(ParticipantRole.AGENT));

    return {
      isValid: hasRequiredRoles,
      message: hasRequiredRoles ? 
        'Required roles present' : 
        'Deal must have a seller and either a buyer or agent'
    };
  }

  private validateParticipantReadiness(deal: Deal): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
  
    // Validate required roles presence
    const roleValidation = this.validateRoleDistribution(deal.participants);
    errors.push(...roleValidation.errors);
    warnings.push(...roleValidation.warnings);
  
    // Validate each participant
    deal.participants.forEach(participant => {
      // Permission validation
      if (!participant.permissions || participant.permissions.length === 0) {
        errors.push({
          code: 'MISSING_PERMISSIONS',
          message: `Participant ${participant.userId} has no permissions defined`,
          severity: 'error'
        });
      }
  
      // Status validation
      if (participant.status !== 'active') {
        warnings.push({
          code: 'INACTIVE_PARTICIPANT',
          message: `Participant ${participant.userId} is not active`,
          recommendation: 'Consider removing or replacing inactive participant'
        });
      }
  
      // Role-specific permission validation
      const rolePermissionErrors = this.validateRolePermissions(participant);
      errors.push(...rolePermissionErrors);
    });
  
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements: [],
      suggestions: []
    };
  }
  
  private validateRoleDistribution(participants: Deal['participants']): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const roleCount = new Map<ParticipantRole, number>();
  
    // Count roles
    participants.forEach(p => {
      roleCount.set(p.role, (roleCount.get(p.role) || 0) + 1);
    });
  
    // Validate seller presence
    if (!roleCount.has(ParticipantRole.SELLER)) {
      errors.push({
        code: 'MISSING_SELLER',
        message: 'Deal must have a seller',
        severity: 'critical'
      });
    }
  
    // Validate buyer/agent presence
    if (!roleCount.has(ParticipantRole.BUYER) && !roleCount.has(ParticipantRole.AGENT)) {
      errors.push({
        code: 'MISSING_BUYER_OR_AGENT',
        message: 'Deal must have either a buyer or an agent',
        severity: 'critical'
      });
    }
  
    // Check for role conflicts
    if ((roleCount.get(ParticipantRole.SELLER) ?? 0) > 1) {
      warnings.push({
        code: 'MULTIPLE_SELLERS',
        message: 'Multiple sellers detected',
        recommendation: 'Consider consolidating seller roles'
      });
    }
  
    // Check for recommended roles
    if (!roleCount.has(ParticipantRole.VETERINARIAN)) {
      warnings.push({
        code: 'MISSING_VETERINARIAN',
        message: 'No veterinarian assigned',
        recommendation: 'Consider adding a veterinarian for medical oversight'
      });
    }
  
    return { errors, warnings };
  }
  
  private validateRolePermissions(participant: DealParticipant): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredPermissions = this.getRequiredPermissionsForRole(participant.role);
    
    requiredPermissions.forEach(permission => {
      if (!participant.permissions.includes(permission)) {
        errors.push({
          code: 'MISSING_REQUIRED_PERMISSION',
          message: `${participant.role} requires permission: ${permission}`,
          severity: 'error'
        });
      }
    });
  
    return errors;
  }
  
  private getRequiredPermissionsForRole(role: ParticipantRole): string[] {
    const permissionMap: Record<ParticipantRole, string[]> = {
      [ParticipantRole.SELLER]: ['manage_terms', 'manage_documents', 'approve_completion'],
      [ParticipantRole.BUYER]: ['manage_terms', 'manage_documents', 'approve_completion'],
      [ParticipantRole.AGENT]: ['manage_terms', 'manage_documents'],
      [ParticipantRole.VETERINARIAN]: ['manage_documents', 'add_reports'],
      [ParticipantRole.TRAINER]: ['manage_documents', 'add_evaluations'],
      [ParticipantRole.INSPECTOR]: ['manage_documents', 'add_reports'],
      [ParticipantRole.TRANSPORTER]: ['view_details', 'update_logistics']
    };
  
    return permissionMap[role] || [];
  }

  private validateDocuments(deal: Deal): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for duplicate document types
    const documentTypes = deal.documents.map(doc => doc.type);
    const duplicateTypes = documentTypes.filter(
      (type, index) => documentTypes.indexOf(type) !== index
    );

    if (duplicateTypes.length > 0) {
      warnings.push({
        code: 'DUPLICATE_DOCUMENTS',
        message: `Duplicate document types found: ${duplicateTypes.join(', ')}`,
        recommendation: 'Consider versioning documents instead of creating duplicates'
      });
    }

    // Check for pending documents
    const pendingDocs = deal.documents.filter(doc => doc.status === 'pending');
    if (pendingDocs.length > 0) {
      warnings.push({
        code: 'PENDING_DOCUMENTS',
        message: `${pendingDocs.length} documents pending approval`,
        recommendation: 'Follow up on document approvals'
      });
    }

    return { errors, warnings };
  }

  private validateDocumentTypes(documents: DealDocument[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const allowedTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]);
  
    const requiredDocTypes = new Map([
      [DealStage.DOCUMENTATION, ['contract', 'terms_agreement']],
      [DealStage.CLOSING, ['signed_contract', 'payment_confirmation']],
      [DealStage.COMPLETE, ['transfer_of_ownership']]
    ]);
  
    // Validate MIME types
    documents.forEach(doc => {
      if (doc.metadata?.mimeType && !allowedTypes.has(doc.metadata.mimeType)) {
        errors.push({
          code: 'INVALID_DOCUMENT_TYPE',
          message: `Invalid document type: ${doc.metadata.mimeType}`,
          field: doc.name,
          severity: 'error'
        });
      }
  
      // Size validation (15MB limit)
      if (doc.metadata?.size && doc.metadata.size > 15 * 1024 * 1024) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `Document exceeds size limit: ${doc.name}`,
          field: doc.name,
          severity: 'error'
        });
      }
    });
  
    // Stage-specific document requirements
    const documentTypes = new Set(documents.map(d => d.type));
    requiredDocTypes.forEach((required, stage) => {
      const missing = required.filter(type => !documentTypes.has(type));
      if (missing.length > 0) {
        warnings.push({
          code: 'MISSING_REQUIRED_DOCUMENTS',
          message: `Missing required documents for ${stage}: ${missing.join(', ')}`,
          recommendation: `Upload required documents before progressing to ${stage}`
        });
      }
    });
  
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequirements: warnings.map(w => w.message),
      suggestions: warnings.map(w => w.recommendation).filter(Boolean) as string[]
    };
  }

  async validateDocumentWithFeedback(
    deal: Deal,
    document: DealDocument
  ): Promise<DocumentValidationFeedback> {
    const feedback: DocumentValidationFeedback = {
      documentId: document.id,
      status: 'success',
      message: 'Document is valid',
      details: [],
      suggestions: []
    };
  
    try {
      // File type validation
      if (!this.isValidFileType(document.metadata?.mimeType || '')) {
        feedback.status = 'error';
        feedback.message = 'Invalid file type';
        feedback.suggestions = ['Accepted formats: PDF, DOC, DOCX, JPG, PNG'];
      }
  
      // Size validation
      if ((document.metadata?.size ?? 0) > 15 * 1024 * 1024) {
        feedback.status = 'error';
        feedback.message = 'File too large';
        feedback.suggestions = ['Maximum file size: 15MB'];
      }
  
      // Stage-specific validation
      const stageRequirements = this.getStageDocumentRequirements(deal.stage);
      if (stageRequirements.includes(document.type)) {
        if (!feedback.details) {
          feedback.details = [];
        }
        feedback.details.push('This document is required for current stage');
        
        if (document.status === 'rejected') {
          feedback.status = 'error';
          feedback.message = 'Required document was rejected';
          if (!feedback.suggestions) {
            feedback.suggestions = [];
          }
          feedback.suggestions.push(
            `Reason: ${document.metadata?.rejectionReason}`,
            'Please upload a new version addressing the rejection reason'
          );
        }
      }
  
      return feedback;
    } catch (error: any) {
      return {
        documentId: document.id,
        status: 'error',
        message: 'Validation failed',
        details: [error.message]
      };
    }
  }
  
  private isValidFileType(mimeType: string): boolean {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ].includes(mimeType);
  }
  
  async validateDocumentsWithFeedback(deal: Deal): Promise<{
    isValid: boolean;
    feedback: DocumentValidationFeedback[];
    missingRequired: string[];
  }> {
    const allFeedback = await Promise.all(
      deal.documents.map(doc => this.validateDocumentWithFeedback(deal, doc))
    );
  
    const missingTypes = this.getStageDocumentRequirements(deal.stage)
      .filter(type => !deal.documents.some(doc => 
        doc.type === type && doc.status === 'approved'
      ));
  
    return {
      isValid: allFeedback.every(f => f.status !== 'error') && missingTypes.length === 0,
      feedback: allFeedback,
      missingRequired: missingTypes
    };
  }

  private getStageDocumentRequirements(stage: DealStage): string[] {
    const requirements: Record<DealStage, string[]> = {
      [DealStage.INITIATION]: [],
      [DealStage.DISCUSSION]: [],
      [DealStage.EVALUATION]: [],
      [DealStage.DOCUMENTATION]: ['contract', 'terms_agreement'],
      [DealStage.CLOSING]: ['signed_contract', 'payment_confirmation'],
      [DealStage.COMPLETE]: ['transfer_of_ownership']
    };
    return requirements[stage] || [];
  }

  private combineValidationResults(
    ...results: ValidationResult[]
  ): ValidationResult {
    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings),
      missingRequirements: results.flatMap(r => r.missingRequirements),
      suggestions: results.flatMap(r => r.suggestions)
    };
  }
}