import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Plus, X, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { DealType } from '../../types/deal.types';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { useDealNotifications } from '../../hooks/common/use-deal-notifications';

interface DealTermsFormProps {
  onSubmit: (data: FormData) => void;
  onBack: () => void;
  onCancel: () => void;
  initialData?: Partial<FormData>;
  dealType: DealType;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
}

interface FormData {
  price?: number;
  currency?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  conditions: string[];
  specialTerms?: string;
}

const DEFAULT_CONDITIONS: Record<DealType, string[]> = {
  [DealType.FULL_SALE]: [
    'Subject to veterinary inspection',
    'Subject to successful trial period',
    'Includes all equipment listed in inventory'
  ],
  [DealType.LEASE]: [
    'Monthly payments due on the first of each month',
    'Lessee responsible for routine care',
    'Insurance requirements must be maintained'
  ],
  [DealType.PARTNERSHIP]: [
    'Equal share of expenses',
    'Joint decision making required',
    'Right of first refusal on sale'
  ],
  [DealType.BREEDING]: [
    'Live foal guarantee',
    'Breeding soundness exam required',
    'Mare care terms included'
  ],
  [DealType.TRAINING]: [
    'Training schedule to be mutually agreed',
    'Progress reports provided monthly',
    'Performance goals to be documented'
  ]
};

export function DealTermsForm({
  onSubmit,
  onBack,
  onCancel,
  initialData = {},
  dealType,
  currentStep,
  totalSteps,
  title,
  description
}: DealTermsFormProps) {
  const { id } = useParams();

  useDealNotifications(id);
  
  const [formData, setFormData] = useState<FormData>({
    price: initialData.price,
    currency: initialData.currency || 'USD',
    duration: initialData.duration,
    startDate: initialData.startDate,
    endDate: initialData.endDate,
    conditions: initialData.conditions || DEFAULT_CONDITIONS[dealType],
    specialTerms: initialData.specialTerms
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (dealType !== DealType.BREEDING) {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'A valid price is required';
      }
    }

    // Type-specific validations
    switch (dealType) {
      case DealType.LEASE:
      case DealType.TRAINING:
        if (!formData.duration || formData.duration <= 0) {
          newErrors.duration = 'Duration is required';
        }
        if (!formData.startDate && (dealType === DealType.LEASE || dealType === DealType.TRAINING)) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'End date is required';
        }
        break;

      case DealType.BREEDING:
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (formData.conditions.length === 0) {
          newErrors.conditions = 'At least one condition is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, '']
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? value : condition
      )
    }));
  };

  const handleSubmit = () => {
    setTouched({
      price: true,
      currency: true,
      duration: true,
      startDate: true,
      endDate: true,
      conditions: true,
      specialTerms: true
    });

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateForm();
    }
  }, [formData]);

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
        {dealType !== DealType.BREEDING && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Price"
                required
                error={touched.price ? errors.price : undefined}
                description={`Enter the ${dealType.toLowerCase()} price`}
              >
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      price: parseFloat(e.target.value)
                    }))}
                    className="pl-10"
                    placeholder="Enter price"
                  />
                </div>
              </FormField>

              <FormField
                label="Currency"
                required
                error={touched.currency ? errors.currency : undefined}
                description={`Type in the currency code (e.g., USD)`}
              >
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currency: e.target.value
                  }))}
                  placeholder="Currency code (e.g., USD)"
                />
              </FormField>
            </div>
          </Card>
        )}

        {(dealType === DealType.BREEDING) && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <FormField
                label="Start Date"
                required
                error={touched.startDate ? errors.startDate : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      startDate: date?.toISOString()
                    }))}
                  />
                </div>
              </FormField>

            </div>
          </Card>
        )}

        {(dealType === DealType.LEASE || dealType === DealType.TRAINING) && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Duration (months)"
                required
                error={touched.duration ? errors.duration : undefined}
              >
                <Input
                  type="number"
                  min="1"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value)
                  }))}
                  placeholder="Enter duration"
                />
              </FormField>

              <FormField
                label="Start Date"
                required
                error={touched.startDate ? errors.startDate : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      startDate: date?.toISOString()
                    }))}
                  />
                </div>
              </FormField>

              <FormField
                label="End Date"
                required
                error={touched.endDate ? errors.endDate : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.endDate ? new Date(formData.endDate) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      endDate: date?.toISOString()
                    }))}
                  />
                </div>
              </FormField>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Terms & Conditions</h3>
              <Button
                onClick={addCondition}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {formData.conditions.map((condition, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Input
                    value={condition}
                    onChange={(e) => updateCondition(index, e.target.value)}
                    placeholder="Enter condition"
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            <Badge variant="secondary" className="gap-1">
              {formData.conditions.length} Conditions
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <FormField
            label="Special Terms"
            description="Any additional terms or notes specific to this deal"
          >
            <Textarea
              value={formData.specialTerms || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                specialTerms: e.target.value
              }))}
              placeholder="Enter any special terms or conditions..."
              className="h-32"
            />
          </FormField>
        </Card>

        <AnimatePresence>
          {Object.keys(errors).length > 0 && Object.values(touched).some(Boolean) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Please fix the following errors:</p>
              </div>
              <ul className="mt-2 space-y-1">
                {Object.values(errors).map((error, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FormStep>
  );
}