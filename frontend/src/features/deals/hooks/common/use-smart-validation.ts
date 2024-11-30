import { useState, useCallback } from 'react';

interface ValidationStep {
  id: string;
  validationRules: Record<string, (value: any) => string | undefined>;
  requiredFields: string[];
}

export function useSmartValidation(steps: ValidationStep[]) {
  const [validationCache, setValidationCache] = useState<Record<string, boolean>>({});

  const validateStep = useCallback((stepIndex: number, data: any): Record<string, string> => {
    const step = steps[stepIndex];
    const errors: Record<string, string> = {};

    // Validate required fields
    step.requiredFields.forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], data)
        : data[field];

      if (value === undefined || value === null || value === '') {
        errors[field] = `${field.split('.').pop()} is required`;
      }
    });

    // Run custom validation rules
    Object.entries(step.validationRules).forEach(([field, rule]) => {
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], data)
        : data[field];
      
      const error = rule(value);
      if (error) {
        errors[field] = error;
      }
    });

    // Update validation cache
    setValidationCache(prev => ({
      ...prev,
      [step.id]: Object.keys(errors).length === 0
    }));

    return errors;
  }, [steps]);

  const getStepCompletion = useCallback((data: Record<string, any>): Record<string, number> => {
    return steps.reduce((acc, step) => {
      const fieldsWithValues = step.requiredFields.filter(field => {
        const value = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj?.[key], data)
          : data[field];
        return value !== undefined && value !== null && value !== '';
      });

      acc[step.id] = Math.round((fieldsWithValues.length / step.requiredFields.length) * 100);
      return acc;
    }, {} as Record<string, number>);
  }, [steps]);

  const canAdvance = useCallback((stepIndex: number, data: any): boolean => {
    return Object.keys(validateStep(stepIndex, data)).length === 0;
  }, [validateStep]);

  const validateEntireForm = useCallback((data: any): boolean => {
    return steps.every((_, index) => canAdvance(index, data));
  }, [steps, canAdvance]);

  return {
    validateStep,
    getStepCompletion,
    canAdvance,
    validateEntireForm,
    validationCache
  };
}