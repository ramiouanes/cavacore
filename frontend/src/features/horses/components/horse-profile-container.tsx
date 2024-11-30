// src/features/horses/components/horse-profile-container.tsx

import { useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useHorseProfileForm } from '../hooks/use-horse-profile-form';
import { BasicInfoForm } from './forms/basic-info-form';
import { MediaUploadForm } from '@/features/horses/components/forms/media-upload';
import { PerformanceForm } from './forms/performance-form';
import { HealthRecordsForm } from './forms/health-records-form';
import { LineageForm } from './forms/lineage-form';
import { horseService } from '@/features/horses/services/horse-service';
import { Button } from "@/components/ui/button";
import { Horse, HorseHealth, VetRecord, VetRecordFile } from '../types';

export const HorseProfileContainer = () => {
  const navigate = useNavigate();
  const {
    formData,
    currentStep,
    setCurrentStep,
    updateFormData,
    clearFormData,
    handleCancel,
    validateAllSteps
  } = useHorseProfileForm();
  

  const handleBasicInfoSubmit = (data: any) => {
    updateFormData('basicInfo', data);
  };

  const handleMediaSubmit = (data: any) => {
    updateFormData('media', data);
  };

  const handlePerformanceSubmit = (data: any) => {
    updateFormData('performance', data);
  };

  const handleHealthSubmit = (data: any) => {
    updateFormData('health', data);
  };

  const handleLineageSubmit = async (data: any) => {
    try {
      updateFormData('lineage', data, false);
  
      if (!validateAllSteps(formData)) {
        alert('Please fill in all required fields before submitting');
        return;
      }

      //console.log('Submitting data:', formData); 
      //console.log('Media array before submit:', formData.media);
  
      // Create FormData instance
      const formDataToSend = new FormData();

      // Add JSON data
      formDataToSend.append('basicInfo', JSON.stringify(formData.basicInfo));
      formDataToSend.append('performance', JSON.stringify(formData.performance));
      formDataToSend.append('media', JSON.stringify(formData.media.map(item => ({
        type: item.type,
        caption: item.caption || '',
        isMain: item.isMain || false
      }))));
      formDataToSend.append('health', JSON.stringify(formData.health));
      formDataToSend.append('lineage', JSON.stringify(data)); // Use the new lineage data

      // Add media files
      // const mediaMetadata = formData.media.map((item, index) => ({
      //   type: item.type,
      //   caption: item.caption,
      //   isMain: index === 0
      // }));
      // formDataToSend.append('media', JSON.stringify(mediaMetadata));
      
      // Add media files with proper field name
      formData.media.forEach((mediaItem) => {
        if (mediaItem.file) {
          formDataToSend.append('mediaFiles', mediaItem.file);
        }
      });

      // Add vet files if any
      const health = formData.health as HorseHealth;
      if (health?.vetRecords) {
        health.vetRecords.forEach((record: VetRecord) => {
          record.files?.forEach((file: VetRecordFile) => {
            if (file.file instanceof File) {
              formDataToSend.append('vetFiles', file.file);
            }
          });
        });
      }

      //console.log('FormData contents:');
      // formDataToSend.forEach((value, key) => {
      //   //console.log(key, ':', value);
      // });
  
      const response = await horseService.createProfile(formDataToSend);
      if (response) {
        clearFormData();
        navigate('/horses');
      }
    } catch (error: any) {
      console.error('Error creating horse profile:', error);
      alert(error.message || 'Failed to create horse profile');
    }
  };

  useEffect(() => {
    clearFormData();
  }, []);

  const onCancel = async () => {
    if (await handleCancel()) {
      navigate('/horses');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            onSubmit={handleBasicInfoSubmit}
            initialData={formData.basicInfo}
          />
        );
      case 2:
        return (
          <MediaUploadForm
            onSubmit={handleMediaSubmit}
            onBack={handleBack}
            initialData={formData.media}
          />
        );
      case 3:
        return (
          <PerformanceForm
            onSubmit={handlePerformanceSubmit}
            onBack={handleBack}
            initialData={formData.performance}
          />
        );
      case 4:
        return (
          <HealthRecordsForm
            onSubmit={handleHealthSubmit}
            onBack={handleBack}
            initialData={formData.health}
          />
        );
      case 5:
        return (
          <LineageForm
            onSubmit={handleLineageSubmit}
            onBack={handleBack}
            initialData={formData.lineage}
            basicInfo={formData.basicInfo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {renderCurrentStep()}
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};