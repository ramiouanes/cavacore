import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  Truck, 
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  MapPin
} from 'lucide-react';
import { DealType } from '../../types/deal.types';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { useDealNotifications } from '../../hooks/common/use-deal-notifications';

interface DealLogisticsFormProps {
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
  transportation?: {
    pickupLocation?: string;
    deliveryLocation?: string;
    date?: string;
    provider?: string;
    requirements?: string[];
  };
  inspection?: {
    date?: string;
    location?: string;
    inspector?: string;
    requirements?: string[];
  };
  insurance?: {
    provider?: string;
    coverage?: string;
    startDate?: string;
    endDate?: string;
  };
}

const INSURANCE_PROVIDERS = [
  'Markel Insurance',
  'Great American Insurance Group',
  'Lloyd\'s of London',
  'AXA Equine Insurance',
  'Other'
];

const DEFAULT_REQUIREMENTS = {
  transportation: [
    'Valid health certificate required',
    'Professional transport company required',
    'Direct route preferred',
    'Climate-controlled transport'
  ],
  inspection: [
    'Full veterinary examination',
    'X-rays if requested',
    'Performance evaluation',
    'Pre-purchase blood work'
  ]
};

export function DealLogisticsForm({
  onSubmit,
  onBack,
  onCancel,
  initialData = {},
  dealType,
  currentStep,
  totalSteps,
  title,
  description
}: DealLogisticsFormProps) {
  const { id } = useParams();

  useDealNotifications(id);

  const [formData, setFormData] = useState<FormData>({
    transportation: {
      ...initialData.transportation,
      requirements: initialData.transportation?.requirements || DEFAULT_REQUIREMENTS.transportation
    },
    inspection: {
      ...initialData.inspection,
      requirements: initialData.inspection?.requirements || DEFAULT_REQUIREMENTS.inspection
    },
    insurance: initialData.insurance || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (dealType === DealType.FULL_SALE) {
      // Transportation validation
      if (!formData.transportation?.pickupLocation) {
        newErrors['transportation.pickupLocation'] = 'Pickup location is required';
      }
      if (!formData.transportation?.deliveryLocation) {
        newErrors['transportation.deliveryLocation'] = 'Delivery location is required';
      }
      if (!formData.transportation?.date) {
        newErrors['transportation.date'] = 'Transportation date is required';
      }

      // Insurance validation
      if (!formData.insurance?.provider) {
        newErrors['insurance.provider'] = 'Insurance provider is required';
      }
      if (!formData.insurance?.coverage) {
        newErrors['insurance.coverage'] = 'Coverage details are required';
      }
      if (!formData.insurance?.startDate) {
        newErrors['insurance.startDate'] = 'Insurance start date is required';
      }
      if (!formData.insurance?.endDate) {
        newErrors['insurance.endDate'] = 'Insurance end date is required';
      }
    }

    // Inspection validation (required for all types except Training)
    if (dealType !== DealType.TRAINING) {
      if (!formData.inspection?.date) {
        newErrors['inspection.date'] = 'Inspection date is required';
      }
      if (!formData.inspection?.location) {
        newErrors['inspection.location'] = 'Inspection location is required';
      }
      if (!formData.inspection?.inspector) {
        newErrors['inspection.inspector'] = 'Inspector details are required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Mark all relevant fields as touched
    const relevantFields = [
      'transportation.pickupLocation',
      'transportation.deliveryLocation',
      'transportation.date',
      'inspection.date',
      'inspection.location',
      'inspection.inspector',
      'insurance.provider',
      'insurance.coverage',
      'insurance.startDate',
      'insurance.endDate'
    ];

    setTouched(
      relevantFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateForm();
    }
  }, [formData, touched]);

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
        {dealType === DealType.FULL_SALE && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Transportation Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Pickup Location"
                required
                error={touched['transportation.pickupLocation'] ? 
                  errors['transportation.pickupLocation'] : undefined}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={formData.transportation?.pickupLocation || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      transportation: {
                        ...prev.transportation,
                        pickupLocation: e.target.value
                      }
                    }))}
                    placeholder="Enter pickup location"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="Delivery Location"
                required
                error={touched['transportation.deliveryLocation'] ? 
                  errors['transportation.deliveryLocation'] : undefined}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={formData.transportation?.deliveryLocation || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      transportation: {
                        ...prev.transportation,
                        deliveryLocation: e.target.value
                      }
                    }))}
                    placeholder="Enter delivery location"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="Transportation Date"
                required
                error={touched['transportation.date'] ? 
                  errors['transportation.date'] : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.transportation?.date ? 
                      new Date(formData.transportation.date) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      transportation: {
                        ...prev.transportation,
                        date: date?.toISOString()
                      }
                    }))}
                  />
                </div>
              </FormField>

              <FormField
                label="Transport Provider"
                description="Optional transport company details"
              >
                <Input
                  value={formData.transportation?.provider || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    transportation: {
                      ...prev.transportation,
                      provider: e.target.value
                    }
                  }))}
                  placeholder="Enter transport provider"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <Badge variant="secondary" className="gap-1">
                <ClipboardCheck className="w-3 h-3" />
                {formData.transportation?.requirements?.length ?? 0} Transport Requirements
              </Badge>
            </div>
          </Card>
        )}

        {dealType !== DealType.TRAINING && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Inspection Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Inspection Date"
                required
                error={touched['inspection.date'] ? 
                  errors['inspection.date'] : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.inspection?.date ? 
                      new Date(formData.inspection.date) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      inspection: {
                        ...prev.inspection,
                        date: date?.toISOString()
                      }
                    }))}
                  />
                </div>
              </FormField>

              <FormField
                label="Inspection Location"
                required
                error={touched['inspection.location'] ? 
                  errors['inspection.location'] : undefined}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={formData.inspection?.location || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      inspection: {
                        ...prev.inspection,
                        location: e.target.value
                      }
                    }))}
                    placeholder="Enter inspection location"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="Inspector"
                required
                error={touched['inspection.inspector'] ? 
                  errors['inspection.inspector'] : undefined}
              >
                <Input
                  value={formData.inspection?.inspector || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    inspection: {
                      ...prev.inspection,
                      inspector: e.target.value
                    }
                  }))}
                  placeholder="Enter inspector details"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <Badge variant="secondary" className="gap-1">
                <ClipboardCheck className="w-3 h-3" />
                {formData.inspection?.requirements?.length ?? 0} Inspection Requirements
              </Badge>
            </div>
          </Card>
        )}

        {dealType === DealType.FULL_SALE && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Insurance Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Insurance Provider"
                required
                error={touched['insurance.provider'] ? 
                  errors['insurance.provider'] : undefined}
              >
                <Select
                  value={formData.insurance?.provider}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    insurance: {
                      ...prev.insurance,
                      provider: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_PROVIDERS.map((provider) => (
                      <SelectItem 
                        key={provider} 
                        value={provider}
                      >
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Coverage Details"
                required
                error={touched['insurance.coverage'] ? 
                  errors['insurance.coverage'] : undefined}
              >
                <Input
                  value={formData.insurance?.coverage || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    insurance: {
                      ...prev.insurance,
                      coverage: e.target.value
                    }
                  }))}
                  placeholder="Enter coverage details"
                />
              </FormField>

              <FormField
                label="Coverage Start Date"
                required
                error={touched['insurance.startDate'] ? 
                  errors['insurance.startDate'] : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.insurance?.startDate ? 
                      new Date(formData.insurance.startDate) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      insurance: {
                        ...prev.insurance,
                        startDate: date?.toISOString()
                      }
                    }))}
                  />
                </div>
              </FormField>

              <FormField
                label="Coverage End Date"
                required
                error={touched['insurance.endDate'] ? 
                  errors['insurance.endDate'] : undefined}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    date={formData.insurance?.endDate ? 
                      new Date(formData.insurance.endDate) : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      insurance: {
                        ...prev.insurance,
                        endDate: date?.toISOString()
                      }
                    }))}
                    />
                </div>
              </FormField>
            </div>
          </Card>
        )}

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