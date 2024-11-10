import { useState, useEffect } from 'react';
import type { HorseProfileData } from '../types';

const STORAGE_KEY = 'horse_profile_draft';

export const useHorseProfileForm = () => {
  const [formData, setFormData] = useState<HorseProfileData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert stored dates back to File objects for media
        if (parsed.media) {
          parsed.media = parsed.media.map((item: any) => ({
            ...item,
            // We can't store File objects in localStorage, so we'll only keep the preview
            file: null,
          }));
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved form data:', e);
        return getInitialFormData();
      }
    }
    return getInitialFormData();
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Save form data whenever it changes
  useEffect(() => {
    const dataToSave = {
      ...formData,
      media: formData.media.map(item => ({
        ...item,
        file: null, // Don't store File objects
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem(STORAGE_KEY + '_step', currentStep.toString());
  }, [formData, currentStep]);

  const updateFormData = (
    step: keyof HorseProfileData,
    data: any,
    goToNext: boolean = true
  ) => {
    setFormData(prev => ({
      ...prev,
      [step]: data,
    }));
    if (goToNext && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const clearFormData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_step');
    setFormData(getInitialFormData());
    setCurrentStep(1);
  };

  return {
    formData,
    currentStep,
    setCurrentStep,
    updateFormData,
    clearFormData,
  };
};

function getInitialFormData(): HorseProfileData {
  return {
    basicInfo: null,
    media: [],
    performance: null,
    health: null,
    lineage: null,
  };
}
