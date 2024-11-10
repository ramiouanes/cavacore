// src/features/horse-profile/components/horse-profile-container.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BasicInfoForm } from './basic-info-form';
import { MediaUploadForm } from './media-upload';
import { PerformanceForm } from './performance-form';
import { HealthRecordsForm } from './health-records-form';
import { LineageForm } from './lineage-form';
import { useHorseProfileForm } from '../hooks/use-horse-profile-form';
import { horseProfileService } from '../services/horse-profile-service';


// Types for each form's data
interface BasicInfoData {
  name: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  color: string;
}

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'document';
}

interface PerformanceData {
  disciplines: string[];
  currentLevel: string;
  trainingHistory: string;
  achievements: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
  }>;
}

interface HealthData {
  generalHealth: string;
  vaccinations: Array<{
    id: string;
    type: string;
    date: string;
    nextDueDate: string;
    notes: string;
  }>;
  medicalRecords: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    veterinarian: string;
  }>;
  insuranceInfo: string;
  specialCare: string;
}

interface LineageData {
  sire: any;
  dam: any;
  grandparents: {
    paternalGrandsire: any;
    paternalGranddam: any;
    maternalGrandsire: any;
    maternalGranddam: any;
  };
  registrationNumber: string;
  breedingHistory: string;
  bloodlineNotes: string;
  notableAncestors: any[];
}

interface HorseProfileData {
  basicInfo: BasicInfoData | null;
  media: MediaFile[];
  performance: PerformanceData | null;
  health: HealthData | null;
  lineage: LineageData | null;
}

export const HorseProfileContainer = () => {
  const navigate = useNavigate();
  const {
    formData,
    currentStep,
    setCurrentStep,
    updateFormData,
    clearFormData,
  } = useHorseProfileForm();
  const [profileData, setProfileData] = useState<HorseProfileData>({
    basicInfo: null,
    media: [],
    performance: null,
    health: null,
    lineage: null,
  });

  const handleBasicInfoSubmit = (data: BasicInfoData) => {
    updateFormData('basicInfo', data);
  };

  const handleMediaSubmit = (files: MediaFile[]) => {
    updateFormData('media', files);
  };


  const handlePerformanceSubmit = (data: PerformanceData) => {
    updateFormData('performance', data);
  };

  const handleHealthSubmit = (data: HealthData) => {
    updateFormData('health', data);
  };

  const handleLineageSubmit = async (data: LineageData) => {
    updateFormData('lineage', data, false);
    
    try {
      await horseProfileService.createProfile(formData);
      clearFormData(); // Clear the saved form data after successful submission
      navigate('/horses');
    } catch (error) {
      console.error('Error creating horse profile:', error);
      // TODO: Implement error handling
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            onSubmit={handleBasicInfoSubmit}
            initialData={profileData.basicInfo}
          />
        );
      case 2:
        return (
          <MediaUploadForm
            onSubmit={handleMediaSubmit}
            onBack={handleBack}
            initialData={profileData.media}
          />
        );
      case 3:
        return (
          <PerformanceForm
            onSubmit={handlePerformanceSubmit}
            onBack={handleBack}
            initialData={profileData.performance}
          />
        );
      case 4:
        return (
          <HealthRecordsForm
            onSubmit={handleHealthSubmit}
            onBack={handleBack}
            initialData={profileData.health}
          />
        );
      case 5:
        return (
          <LineageForm
            onSubmit={handleLineageSubmit}
            onBack={handleBack}
            initialData={profileData.lineage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {renderCurrentStep()}
      </div>
    </div>
  );
};