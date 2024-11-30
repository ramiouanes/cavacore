// src/features/horses/hooks/use-horse-profile-form.ts

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'horse_profile_form';

interface Horse {
  basicInfo: any;
  media: any[];
  performance: any;
  health: any;
  lineage: any;
}

export const useHorseProfileForm = () => {
  const getStoredData = (): Horse => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : getInitialFormData();
  };

  const [formData, setFormData] = useState<Horse>(getStoredData());
  const [currentStep, setCurrentStep] = useState<number>(
    Number(localStorage.getItem(STORAGE_KEY + '_step')) || 1
  );

  const handleCancel = async () => {
    const confirmed = window.confirm("Are you sure you want to cancel? All progress will be lost.");
    if (confirmed) {
      clearFormData();
      return true;
    }
    return false;
  };

  const validateAllSteps = (data: Horse): boolean => {
    // Basic Info validation
    if (!data.basicInfo?.name || !data.basicInfo?.breed || 
        !data.basicInfo?.gender || !data.basicInfo?.dateOfBirth) {
      return false;
    }
  
    // Media validation
    if (!data.media || data.media.length === 0) {
      return false;
    }
  
    // Performance validation
    if (!data.performance?.disciplines?.length || 
        !data.performance.currentLevel) {
      return false;
    }
  
    // Health validation
    if (!data.health?.generalHealth) {
      return false;
    }
  
    // Validate vaccinations
    // const invalidVaccinations = data.health.vaccinations.some(
    //   v => !v.type || !v.date || !v.nextDueDate
    // );
    // if (invalidVaccinations) {
    //   return false;
    // }
  
    // // Validate medical records
    // const invalidMedicalRecords = data.health.medicalRecords.some(
    //   r => !r.date || !r.type || !r.description || !r.veterinarian
    // );
    // if (invalidMedicalRecords) {
    //   return false;
    // }
  
    // Lineage validation
    if (!data.lineage?.registrationNumber || 
        !data.lineage.sire?.name || !data.lineage.sire?.breed ||
        !data.lineage.dam?.name || !data.lineage.dam?.breed) {
      return false;
    }
  
    return true;
  };

  useEffect(() => {
    const dataToSave = {
      ...formData,
      media: formData.media?.map(item => ({
        ...item,
        file: null
      })) || [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem(STORAGE_KEY + '_step', currentStep.toString());
  }, [formData, currentStep]);

  const updateFormData = (
    step: keyof Horse,
    data: any,
    goToNext: boolean = true
  ) => {
    setFormData(prev => ({
      ...prev,
      [step]: data,
    }));
    
    if (goToNext && currentStep <= 5) {
      setCurrentStep(prev => prev + 1);
    }
    const dataToStore = {
      ...formData,
      media: formData.media?.map(item => ({
        id: item.id,
        preview: item.preview,
        type: item.type
        // Don't store the actual file object
      }))
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
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
    validateAllSteps,
    handleCancel
  };
};

function getInitialFormData(): Horse {
  return {
    basicInfo: {
      name: '',
      breed: '',
      dateOfBirth: '',
      gender: '',
      height: '',
      color: '',
    },
    media: [],
    performance: {
      disciplines: [],
      currentLevel: '',
      trainingHistory: '',
      achievements: []
    },
    health: {
      generalHealth: '',
      vaccinations: [],
      medicalRecords: [],
      insuranceInfo: '',
      specialCare: '',
      vetRecords: []
    },
    lineage: {
      registrationNumber: '',
      passportNumber: '',
      sire: {
        id: uuidv4(),
        name: '',
        breed: '',
      },
      dam: {
        id: uuidv4(),
        name: '',
        breed: '',
      },
      breedingHistory: '',
      bloodlineNotes: ''
    }
  };
}