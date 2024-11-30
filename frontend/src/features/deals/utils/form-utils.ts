import { DealType, ParticipantRole } from '../types/deal.types';

interface SmartDefaultOptions {
  dealType: DealType;
  userRole?: ParticipantRole;
  previousValues?: Record<string, any>;
}

export const formUtils = {
  /**
   * Intelligently generates form field defaults based on deal type and context
   */
  getSmartDefaults(field: string, options: SmartDefaultOptions) {
    const { dealType, userRole, previousValues } = options;

    // Use previous values if available for better suggestions
    if (previousValues?.[field]) {
      return previousValues[field];
    }

    switch (field) {
      case 'participants': {
        const defaults = [];
        
        // Auto-add current user if seller/buyer
        if (userRole === ParticipantRole.SELLER) {
          defaults.push({
            role: ParticipantRole.SELLER,
            permissions: ['manage_terms', 'manage_documents', 'approve_completion']
          });
        } else if (userRole === ParticipantRole.BUYER) {
          defaults.push({
            role: ParticipantRole.BUYER,
            permissions: ['manage_terms', 'manage_documents', 'approve_completion']
          });
        }

        // Add recommended participants based on deal type
        if (dealType === DealType.FULL_SALE) {
          defaults.push(
            { role: ParticipantRole.VETERINARIAN, permissions: ['manage_documents', 'add_reports'] },
            { role: ParticipantRole.INSPECTOR, permissions: ['manage_documents', 'add_reports'] }
          );
        } else if (dealType === DealType.BREEDING) {
          defaults.push(
            { role: ParticipantRole.VETERINARIAN, permissions: ['manage_documents', 'add_reports'] }
          );
        }

        return defaults;
      }

      case 'terms': {
        const defaults: Record<string, any> = {};
        
        // Set default terms based on deal type
        switch (dealType) {
          case DealType.LEASE:
          case DealType.TRAINING:
            defaults.duration = 6; // 6 months default
            defaults.startDate = new Date().toISOString();
            defaults.endDate = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          
          case DealType.BREEDING:
            defaults.startDate = new Date().toISOString();
            defaults.conditions = [
              'Health check required before breeding',
              'Breeding to occur at agreed facility',
              'Transportation costs shared equally'
            ];
            break;
          
          case DealType.PARTNERSHIP:
            defaults.conditions = [
              'Equal share of costs and profits',
              'Major decisions require mutual agreement',
              'Right of first refusal on sale'
            ];
            break;
        }

        return defaults;
      }

      case 'documents': {
        // Return required documents based on deal type
        const baseDocuments = ['Transfer of Ownership', 'Bill of Sale'];
        
        switch (dealType) {
          case DealType.FULL_SALE:
            return [...baseDocuments, 'Veterinary Report', 'Insurance Certificate'];
          
          case DealType.LEASE:
            return ['Lease Agreement', 'Insurance Certificate', 'Condition Report'];
          
          case DealType.BREEDING:
            return ['Breeding Contract', 'Health Certificate', 'Registration Papers'];
          
          case DealType.PARTNERSHIP:
            return ['Partnership Agreement', 'Financial Terms', 'Insurance Policy'];
          
          case DealType.TRAINING:
            return ['Training Agreement', 'Liability Release', 'Goals Document'];
          
          default:
            return baseDocuments;
        }
      }

      case 'logistics': {
        const defaults: Record<string, any> = {};

        if (dealType === DealType.FULL_SALE) {
          defaults.insurance = {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
          };
          
          defaults.transportation = {
            requirements: [
              'Valid health certificate',
              'Professional transport company',
              'Direct route preferred'
            ]
          };
        }

        return defaults;
      }

      default:
        return undefined;
    }
  },

  /**
   * Validates field values with contextual rules
   */
  validateField(field: string, value: any, context: Record<string, any>): string | undefined {
    switch (field) {
      case 'price':
        if (typeof value !== 'number' || value <= 0) {
          return 'Price must be a positive number';
        }
        // Check if price is within reasonable range based on horse value
        if (context.horseValue && (value < context.horseValue * 0.5 || value > context.horseValue * 2)) {
          return 'Price seems unusual for this horse\'s value';
        }
        return undefined;

      case 'duration':
        if (typeof value !== 'number' || value <= 0) {
          return 'Duration must be a positive number';
        }
        if (value > 24) {
          return 'Duration seems unusually long';
        }
        return undefined;

      case 'startDate':
        const start = new Date(value);
        if (isNaN(start.getTime())) {
          return 'Invalid date format';
        }
        if (start < new Date()) {
          return 'Start date cannot be in the past';
        }
        return undefined;

      case 'participants':
        if (!Array.isArray(value) || value.length < 2) {
          return 'At least two participants are required';
        }
        const hasRequiredRoles = value.some(p => p.role === ParticipantRole.SELLER) &&
          value.some(p => p.role === ParticipantRole.BUYER || p.role === ParticipantRole.AGENT);
        if (!hasRequiredRoles) {
          return 'Must include both seller and buyer/agent';
        }
        return undefined;

      default:
        return undefined;
    }
  },

  /**
   * Suggests next actions based on current form state
   */
  getSuggestions(formData: Record<string, any>): string[] {
    const suggestions: string[] = [];

    // Check for missing critical information
    if (!formData.terms?.price) {
      suggestions.push('Add price information to proceed with the deal');
    }

    if (!formData.participants?.length) {
      suggestions.push('Add key participants to the deal');
    }

    if (formData.type === DealType.FULL_SALE) {
      if (!formData.logistics?.insurance) {
        suggestions.push('Consider adding insurance details for full sale');
      }
      if (!formData.logistics?.transportation) {
        suggestions.push('Plan transportation logistics for the sale');
      }
    }

    // Check document completeness
    const documents = formData.documents || [];
    if (documents.length === 0) {
      suggestions.push('Upload required documentation');
    }

    return suggestions;
  },

  /**
   * Formats field values for display or submission
   */
  formatFieldValue(field: string, value: any): any {
    switch (field) {
      case 'price':
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD' 
            }).format(value)
          : value;

      case 'startDate':
      case 'endDate':
        return value instanceof Date
          ? value.toISOString()
          : typeof value === 'string'
          ? new Date(value).toISOString()
          : value;

      case 'participants':
        return Array.isArray(value)
          ? value.map(p => ({
              ...p,
              role: p.role.charAt(0).toUpperCase() + p.role.slice(1)
            }))
          : value;

      default:
        return value;
    }
  }
};