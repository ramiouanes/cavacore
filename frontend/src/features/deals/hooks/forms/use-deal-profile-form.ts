import { useState, useEffect, useCallback } from 'react';
import { DealType, DealStatus, DealStage, ParticipantRole } from '../../types/deal.types';
import { useAuth } from '@/features/auth/contexts/auth-context';
import {
    DealBasicInfo,
    DealParticipant,
    DealTerms,
    DealLogistics,
    DealDocument
} from '../../types/deal.types';
import { TimelineEntry, TimelineEventType } from '../../types/timeline.types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'horse_profile_form';

interface UseDealProfileFormProps {
    initialData?: {
      basicInfo?: DealBasicInfo;
      participants?: DealParticipant[];
      terms?: DealTerms;
      logistics?: DealLogistics;
      documents?: DealDocument[];
      timeline?: TimelineEntry[];
    };
  }


interface FormStep {
    id: string;
    validationRules: Record<string, (value: any) => string | undefined>;
    requiredFields: string[];
    recommendations: string[];
}

const FORM_STEPS: FormStep[] = [
    {
        id: 'basicInfo',
        validationRules: {
            type: (value) => !value ? 'Deal type is required' : undefined,
            horseId: (value) => !value ? 'Horse selection is required' : undefined,
        },
        requiredFields: ['type', 'horseId'],
        recommendations: [
            'Consider adding relevant tags for better organization',
            'Include detailed notes for complex deals',
        ]
    },
    {
        id: 'participants',
        validationRules: {
            participants: (value: any[]) => {
                // console.log(value);
                if (!value || !Array.isArray(value) || value.length < 2) {
                    return 'At least two participants are required';
                }

                const hasSeller = value.some(p => p.role === ParticipantRole.SELLER);
                const hasBuyerOrAgent = value.some(p =>
                    p.role === ParticipantRole.BUYER || p.role === ParticipantRole.AGENT
                );

                if (!hasSeller || !hasBuyerOrAgent) {
                    return 'Must include both seller and buyer/agent';
                }

                return undefined;
            }
        },
        requiredFields: ['participants'],
        recommendations: [
            'Include all necessary contact information',
            'Clearly define roles and responsibilities',
            'Consider adding professional advisors'
        ]
    },
    {
        id: 'terms',
        validationRules: {
            'terms.price': (value) => !value ? 'Price is required' : undefined,
            'terms.conditions': (value) =>
                !value?.length ? 'At least one condition is required' : undefined
        },
        requiredFields: ['terms.price', 'terms.conditions'],
        recommendations: [
            'Be specific about payment terms',
            'Include all relevant conditions',
            'Specify important dates clearly'
        ]
    },
    {
        id: 'logistics',
        validationRules: {
            'logistics.transportation': (value) =>
                !value?.date ? 'Transportation date is required' : undefined,
            'logistics.insurance': (value) =>
                !value?.provider ? 'Insurance details are required' : undefined
        },
        requiredFields: ['logistics.transportation', 'logistics.insurance'],
        recommendations: [
            'Arrange transportation well in advance',
            'Ensure insurance coverage is adequate',
            'Double-check all dates and locations'
        ]
    },
    {
        id: 'documents',
        validationRules: {
            documents: (value) =>
                !value?.length ? 'Required documents must be uploaded' : undefined
        },
        requiredFields: ['documents'],
        recommendations: [
            'Ensure all documents are properly signed',
            'Include all necessary supporting documentation',
            'Keep copies of all uploaded files'
        ]
    }
];


interface DealProfile {
    basicInfo: DealBasicInfo;
    participants: DealParticipant[];
    terms: DealTerms;
    logistics?: DealLogistics;
    docs: DealDocument[];
    timeline: TimelineEntry[];
}


interface ProgressData {
    total: number;
    byStep: Record<string, number>;
    missingRequirements: string[];
}


export function useDealProfileForm({ initialData }: UseDealProfileFormProps = {}) {

    const getStoredData = (): DealProfile => {
        // If initialData exists, use it (editing mode)
        if (initialData) {
            return {
                basicInfo: initialData.basicInfo || getInitialFormData().basicInfo,
                participants: initialData.participants || [],
                terms: initialData.terms || {},
                logistics: initialData.logistics || {},
                docs: initialData.documents || [],
                timeline: initialData.timeline || []
            };
        }

        // Otherwise check localStorage (new deal)
        const storedData = localStorage.getItem(STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : getInitialFormData();
    };
    const { user } = useAuth();
    
    const [touched, setTouched] = useState<Record<string, boolean>>({});


    // const getStorageKey = useCallback(() => {
    //     return user?.id ? `deal_profile_form_${user.id}` : null;
    // }, [user?.id]);

    // const getStoredData = useCallback((): DealProfile => {
    //     const key = STORAGE_KEY;
    //     if (!key) return getInitialFormData();
        
    //     const storedData = localStorage.getItem(key);
    //     if (!storedData) return getInitialFormData();

    //     try {
    //         const parsed = JSON.parse(storedData);
    //         return parsed;
    //     } catch {
    //         return getInitialFormData();
    //     }
    // }, [getStorageKey]);


    const [formData, setFormData] = useState<DealProfile>(getStoredData());
    const [currentStep, setCurrentStep] = useState<number>(1);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState<ProgressData>({
        total: 0,
        byStep: {},
        missingRequirements: []
    });



    // Validation
    const validateStep = useCallback((stepNumber: number, data: any): Record<string, string> => {
        const newErrors: Record<string, string> = {};
        
        switch (stepNumber) {
            case 1: // Basic Info
                if (!data.type) newErrors.type = 'Deal type is required';
                if (!data.horseId) newErrors.horseId = 'Horse selection is required';
                break;
            
            case 2: // Participants
                if (!data || !Array.isArray(data) || data.length < 2) {
                    newErrors.participants = 'At least two participants are required';
                } else {
                    const hasSeller = data.some(p => p.role === ParticipantRole.SELLER);
                    const hasBuyer = data.some(p => p.role === ParticipantRole.BUYER);
                    if (!hasSeller) newErrors.participants = 'A seller is required';
                    if (!hasBuyer) newErrors.participants = 'A buyer is required';
                }
                break;
            
            case 3: // Terms
                if (!data.price && formData.basicInfo.type !== DealType.BREEDING) {
                    newErrors.price = 'Price is required';
                }
                if (!data.conditions || data.conditions.length === 0) {
                    newErrors.conditions = 'At least one condition is required';
                }
                break;
            
            case 4: // Logistics
                if (formData.basicInfo.type === DealType.FULL_SALE) {
                    if (!data?.transportation?.date) {
                        newErrors['transportation.date'] = 'Transportation date is required';
                    }
                    if (!data?.insurance?.provider) {
                        newErrors['insurance.provider'] = 'Insurance provider is required';
                    }
                }
                break;
            
            case 5: // Documents
                if (!data || !Array.isArray(data) || data.length === 0) {
                    newErrors.documents = 'At least one document is required';
                }
                break;
        }

        return newErrors;
    }, [formData.basicInfo.type]);



    
    const updateFormData = (
      step: keyof DealProfile,
      data: any,
      goToNext: boolean = true
    ) => {
        setFormData(prev => ({
            ...prev,
            [step]: data,
            timeline: [
              ...(prev.timeline || []), // Handle potential undefined
              {
                id: uuidv4(),
                type: TimelineEventType.STAGE_CHANGE,
                stage: currentStep === 5 ? DealStage.INITIATION : prev.basicInfo.stage,
                status: DealStatus.ACTIVE,
                date: new Date().toISOString(),
                description: `${step.charAt(0).toUpperCase() + step.slice(1)} information updated`,
                actor: 'system',
                metadata: {
                  automatic: true,
                  step: currentStep,
                  updatedFields: Object.keys(data)
                }
              }
            ]
          }));

      setTouched(prev => ({
        ...prev,
        [step]: true
    }));
      
      if (goToNext && currentStep <= 5) {
        setCurrentStep(prev => prev + 1);
      }
      const dataToStore = {
        ...formData,
        docs: formData.docs?.map(item => ({
            id: item.id,
            type: item.documentType,
            status: item.status || '',      
          // Don't store the actual file object
        }))
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    };

    // Add effect to update form data when initialData changes
    useEffect(() => {
        if (initialData?.basicInfo) {
            setFormData(prev => ({
                ...prev,
                basicInfo: initialData.basicInfo || prev.basicInfo,
                participants: initialData.participants || prev.participants,
                terms: initialData.terms || prev.terms,
                logistics: initialData.logistics || prev.logistics,
                docs: initialData.documents || prev.docs,
                timeline: initialData.timeline || prev.timeline
            }));
        }
    }, [initialData]);


    // useEffect(() => {
    //     const key = getStorageKey();
    //     if (!key) return;

    //     const dataToStore = {
    //         ...formData,
    //         documents: formData.docs?.map(doc => ({
    //             ...doc,
    //             file: null // Don't store file objects
    //         })) || []
    //     };

    //     localStorage.setItem(key, JSON.stringify(dataToStore));
    //     localStorage.setItem(`${key}_step`, currentStep.toString());

    //     // Update progress
    //     updateProgress(formData);
    // }, [formData, currentStep, getStorageKey]);



    // Progress tracking
    const updateProgress = (data: DealProfile) => {
        const steps = {
            basicInfo: isBasicInfoComplete(data.basicInfo),
            participants: isParticipantsComplete(data.participants),
            terms: isTermsComplete(data.terms),
            logistics: isLogisticsComplete(data.logistics),
            documents: isDocumentsComplete(data.docs)
        };

        const completedSteps = Object.values(steps).filter(Boolean).length;
        const totalSteps = Object.keys(steps).length;

        setProgress({
            total: (completedSteps / totalSteps) * 100,
            byStep: {
                basicInfo: steps.basicInfo ? 100 : 0,
                participants: steps.participants ? 100 : 0,
                terms: steps.terms ? 100 : 0,
                logistics: steps.logistics ? 100 : 0,
                documents: steps.documents ? 100 : 0
            },
            missingRequirements: getMissingRequirements(data)
        });
    };

    // Helper functions for progress calculation
    const isBasicInfoComplete = (basicInfo: DealBasicInfo) => 
        !!(basicInfo.type && basicInfo.horseId);

    const isParticipantsComplete = (participants: DealParticipant[]) =>
        participants.length >= 2 &&
        participants.some(p => p.role === ParticipantRole.SELLER) &&
        participants.some(p => p.role === ParticipantRole.BUYER);

    const isTermsComplete = (terms: DealTerms) =>
        !!(terms.conditions && terms.conditions.length > 0);

    const isLogisticsComplete = (logistics?: DealLogistics) =>
        formData.basicInfo.type !== DealType.FULL_SALE || 
        !!(logistics?.transportation?.date && logistics?.insurance?.provider);

    const isDocumentsComplete = (documents: DealDocument[]) =>
        documents.length > 0;

    const getMissingRequirements = (data: DealProfile): string[] => {
        const missing: string[] = [];
        
        if (!isBasicInfoComplete(data.basicInfo)) {
            missing.push('Complete basic information');
        }
        if (!isParticipantsComplete(data.participants)) {
            missing.push('Add required participants');
        }
        if (!isTermsComplete(data.terms)) {
            missing.push('Define deal terms');
        }
        if (!isLogisticsComplete(data.logistics)) {
            missing.push('Complete logistics information');
        }
        if (!isDocumentsComplete(data.docs)) {
            missing.push('Upload required documents');
        }

        return missing;
    };

    const getStepNumber = (step: keyof DealProfile): number => {
        const steps: Record<keyof DealProfile, number> = {
            basicInfo: 1,
            participants: 2,
            terms: 3,
            logistics: 4,
            docs: 5,
            timeline: 1
        };
        return steps[step];
    };


    // Get recommendations
    const getRecommendations = useCallback((stepIndex: number): string[] => {
        const step = FORM_STEPS[stepIndex - 1];
        if (!step) return [];

        return step.recommendations.filter(rec => {
            const stepProgress = progress.byStep[step.id] || 0;
            return stepProgress < 100; // Only show recommendations for incomplete steps
        });
    }, [progress]);
    


    // Cleanup effect
    const clearFormData = () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_step');
      setFormData(getInitialFormData());
      setCurrentStep(1);
      setErrors({});
      setTouched({})
    };

    const handleCancel = async () => {
      const confirmed = window.confirm("Are you sure you want to cancel? All progress will be lost.");
      if (confirmed) {
        clearFormData();
        return true;
      }
      return false;
    };



    return {
        formData,
        currentStep,
        progress,
        errors,
        setCurrentStep,
        updateFormData,
        clearFormData,
        validateStep,
        validateAllSteps: (data: DealProfile) => {
            const stepKeys: (keyof DealProfile)[] = ['basicInfo', 'participants', 'terms', 'logistics'];
            for (let i = 1; i <= 4; i++) {
                // console.log('data from validateAllSteps', data);
                const errors = validateStep(i, data[stepKeys[i - 1]]);
                // console.log('errors from validateAllSteps', errors);
                if (Object.keys(errors).length > 0) return false;
            }
            return true;
        },
        handleCancel,
        getRecommendations
    };
};


function getInitialFormData(): DealProfile {
    return {
        basicInfo: {
            type: DealType.FULL_SALE,
            horseId: '',
            tags: [],
            notes: '',
            stage: DealStage.INITIATION,
            status: DealStatus.ACTIVE
        },
        participants: [],
        terms: {
            conditions: []
        },
        logistics: undefined,
        docs: [],
        timeline: [{
            id: uuidv4(),
            type: TimelineEventType.STAGE_CHANGE,
            stage: DealStage.INITIATION,
            status: DealStatus.ACTIVE,
            date: new Date().toISOString(),
            description: 'Deal initiated',
            actor: 'system',
            metadata: { automatic: true }
          }]
      
    };
}