import { useState, useCallback } from 'react';

interface Step {
  id: string;
  recommendations: string[];
  requiredFields: string[];
}

interface Progress {
  total: number;
  byStep: Record<string, number>;
  completedFields: string[];
}

export function useProgressTracking(steps: Step[]) {
  const [progress, setProgress] = useState<Progress>({
    total: 0,
    byStep: {},
    completedFields: []
  });

  const updateProgress = useCallback((formData: Record<string, any>) => {
    const allFields = steps.flatMap(step => step.requiredFields);
    const completedFields = allFields.filter(field => {
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], formData)
        : formData[field];
      return value !== undefined && value !== null && value !== '';
    });

    const byStep = steps.reduce((acc, step) => {
      const stepFields = step.requiredFields;
      const completed = stepFields.filter(field => completedFields.includes(field));
      acc[step.id] = Math.round((completed.length / stepFields.length) * 100);
      return acc;
    }, {} as Record<string, number>);

    const total = Math.round((completedFields.length / allFields.length) * 100);

    setProgress({
      total,
      byStep,
      completedFields
    });

    return { total, byStep, completedFields };
  }, [steps]);

  const getRecommendations = useCallback((currentStep: number, formData: any) => {
    const step = steps[currentStep];
    if (!step?.recommendations) return [];

    // Filter recommendations based on current progress
    return step.recommendations.filter(rec => {
      // Custom logic to determine if recommendation is still relevant
      const stepProgress = progress.byStep[step.id] || 0;
      return stepProgress < 100;
    });
  }, [steps, progress]);

  const getPendingItems = useCallback((stepId: string): string[] => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return [];

    return step.requiredFields.filter(
      field => !progress.completedFields.includes(field)
    );
  }, [steps, progress.completedFields]);

  return {
    progress,
    updateProgress,
    getRecommendations,
    getPendingItems
  };
}