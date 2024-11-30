// src/features/deals/components/forms/deal-basic-form.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DealType, DealBasicInfo, DealStatus, DealStage } from '../../types/deal.types';
import { useHorseSearch } from '@/features/horses/contexts/horse-search-context';
import { useQuery } from '@tanstack/react-query';
import { horseService } from '@/features/horses/services/horse-service';
import { useParams } from 'react-router-dom';
import { useDealNotifications } from '../../hooks/common/use-deal-notifications';

interface DealBasicFormProps {
  onSubmit: (data: DealBasicInfo) => void;
  onBack?: () => void;
  onCancel?: () => void;
  initialData?: Partial<DealBasicInfo>;
  // dealType?: string;
  // dealStage?: DealStage;
  // dealStatus?: DealStatus;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
}

interface FormErrors {
  type?: string;
  horseId?: string;
  stage?: string;
  status?: string;
  tags?: string;
  notes?: string;
}



export const DealBasicForm = ({
  onSubmit,
  onBack,
  onCancel,
  initialData = {},
  currentStep,
  totalSteps,
  title,
  description
}: DealBasicFormProps) => {
  const [formData, setFormData] = useState<DealBasicInfo>({
    type: initialData.type ?? DealType.FULL_SALE,
    horseId: initialData.horseId ?? '',
    stage: initialData.stage ?? DealStage.INITIATION,
    status: initialData.status ?? DealStatus.ACTIVE,
    tags: initialData.tags ?? [],
    notes: initialData.notes ?? ''
  });
  const { horses } = useHorseSearch();
  const { setHorses } = useHorseSearch();
  const { id } = useParams();

  useDealNotifications(id);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof DealBasicInfo, boolean>>({
    type: true,
    horseId: true,
    stage: false,
    status: false,
    tags: false,
    notes: false
  });


  const { data: horsesData, isLoading } = useQuery({
    queryKey: ['horses'],
    queryFn: () => horseService.searchHorses({
      page: 1,
      limit: 100 // Adjust limit as needed
    })
  });

  // Update context when horses are fetched
  useEffect(() => {
    if (horsesData?.horses) {
      setHorses(horsesData.horses);
    }
  }, [horsesData, setHorses]);


  const validateField = (field: keyof DealBasicInfo, value: any): string | undefined => {
    switch (field) {
      case 'type':
        if (!value) return 'Deal type is required';
        return undefined;

      case 'horseId':
        if (!value) return 'Horse selection is required';
        return undefined;

      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof DealBasicInfo>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (field: keyof DealBasicInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: touched[field] ? error : undefined
    }));
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateForm();
    }
  }, [formData]);

  const handleSubmit = () => {
    setTouched(Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {} as Record<keyof DealBasicInfo, boolean>));

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <FormStep
      title={title}
      description={description}
      currentStep={currentStep}
      totalSteps={totalSteps}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
      onCancel={onCancel}
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6">
          <FormField
            label="Deal Type"
            required
            error={touched.type ? errors.type : undefined}
            description="Select the type of deal you want to create"
          >
            <Select
              value={formData.type}
              onValueChange={(value) => handleFieldChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deal type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DealType).map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type}
                    className="capitalize"
                  >
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Card>

        <Card className="p-6">
          <FormField
            label="Horse"
            required
            error={touched.horseId ? errors.horseId : undefined}
            description="Select the horse for this deal"
          >
            <Select
              value={formData.horseId}
              onValueChange={(value) => handleFieldChange('horseId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select horse" />
              </SelectTrigger>
              <SelectContent>
              {horsesData?.horses.map((horse) => (
                  <SelectItem key={horse.id} value={horse.id ?? ''}>
                    {horse.basicInfo.name} - {horse.basicInfo.breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Card>

        <Card className="p-6">
          <FormField
            label="Tags"
            description="Add tags to help organize this deal (comma separated)"
          >
            <Input
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="Enter tags..."
            />
          </FormField>
        </Card>

        <Card className="p-6">
          <FormField
            label="Notes"
            description="Add any additional notes about this deal"
          >
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              placeholder="Enter notes..."
              className="h-32"
            />
          </FormField>
        </Card>
      </motion.div>
    </FormStep>
  );
}

export default DealBasicForm;