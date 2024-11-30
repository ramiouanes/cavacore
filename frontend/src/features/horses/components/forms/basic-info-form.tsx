import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from "@/components/ui/date-picker";
import { AlertCircle } from 'lucide-react';
import { HorseBasicInfo, HorseGender } from '../../types';

const HORSE_BREEDS = [
  'Thoroughbred',
  'Arabian',
  'Quarter Horse',
  'Warmblood',
  'Friesian',
  'Andalusian',
  'Appaloosa',
  'Morgan',
  'Paint Horse',
  'Tennessee Walker',
  'Standardbred',
  'Clydesdale',
  'Shire',
  'Saddlebred',
  'Mustang'
];

const HORSE_COLORS = [
  'Bay',
  'Black',
  'Chestnut',
  'Grey',
  'Palomino',
  'Pinto',
  'Roan',
  'Sorrel',
  'White',
  'Buckskin',
  'Dun',
  'Cremello'
];

interface BasicInfoFormProps {
  onSubmit: (data: HorseBasicInfo) => void;
  onBack?: () => void;
  initialData?: Partial<HorseBasicInfo>;
}

interface FormErrors {
  name?: string;
  breed?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: string;
  color?: string;
}

export const BasicInfoForm = ({ onSubmit, onBack, initialData = {} }: BasicInfoFormProps) => {
  const [formData, setFormData] = useState<HorseBasicInfo>({
    name: initialData.name ?? '',
    breed: initialData.breed ?? '',
    dateOfBirth: initialData.dateOfBirth ?? '',
    gender: initialData.gender ?? HorseGender.MARE,
    height: initialData.height ?? 0,
    color: initialData.color ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof HorseBasicInfo, boolean>>({
    name: false,
    breed: false,
    dateOfBirth: false,
    gender: false,
    height: false,
    color: false,
  });

  const validateField = (field: keyof HorseBasicInfo, value: any): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 50) return 'Name must be less than 50 characters';
        return undefined;

      case 'breed':
        if (!value) return 'Breed is required';
        return undefined;

      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        if (birthDate > today) return 'Date of birth cannot be in the future';
        if (birthDate < new Date(today.getFullYear() - 40, today.getMonth())) {
          return 'Horse age seems unrealistic';
        }
        return undefined;

      case 'gender':
        if (!Object.values(HorseGender).includes(value)) {
          return 'Please select a valid gender';
        }
        return undefined;

      case 'height':
        if (!value) return 'Height is required';
        const heightNum = Number(value);
        if (isNaN(heightNum)) return 'Height must be a number';
        if (heightNum < 10) return 'Height seems too low';
        if (heightNum > 20) return 'Height seems too high';
        return undefined;

      case 'color':
        if (!value) return 'Color is required';
        return undefined;

      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof HorseBasicInfo>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (field: keyof HorseBasicInfo, value: any) => {
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
    }), {} as Record<keyof HorseBasicInfo, boolean>));

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <FormStep
      title="Basic Information"
      description="Enter the basic details about your horse"
      currentStep={1}
      totalSteps={5}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
          <FormField
            label="Horse Name"
            required
            error={touched.name ? errors.name : undefined}
            description="Enter your horse's registered or common name"
          >
            <Input
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              placeholder="Enter horse's name"
              className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
            />
          </FormField>
        </Card>

        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
          <FormField
            label="Breed"
            required
            error={touched.breed ? errors.breed : undefined}
            description="Select your horse's primary breed"
          >
            <Select
              value={formData.breed}
              onValueChange={(value) => handleFieldChange('breed', value)}
            >
              <SelectTrigger className="h-12 bg-white/50 focus:bg-white transition-colors duration-300">
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {HORSE_BREEDS.map((breed) => (
                  <SelectItem
                    key={breed}
                    value={breed}
                    className="focus:bg-primary/5 cursor-pointer"
                  >
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Card>


        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
        <FormField
          label="Date of Birth"
          required
          error={touched.dateOfBirth ? errors.dateOfBirth : undefined}
          description="Select your horse's date of birth"
        >
          <DatePicker
            date={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
            onSelect={(date) => handleFieldChange(
              'dateOfBirth',
              date?.toISOString() || ''
            )}
            className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
          />
        </FormField>
        </Card>

        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
        <FormField
          label="Gender"
          required
          error={touched.gender ? errors.gender : undefined}
          description="Select your horse's gender"
        >
          <Select
            value={formData.gender}
            onValueChange={(value) => handleFieldChange('gender', value as HorseGender)}
          >
              <SelectTrigger className="h-12 bg-white/50 focus:bg-white transition-colors duration-300">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
            {Object.values(HorseGender).map((gender) => (
                <SelectItem key={gender} value={gender} className="focus:bg-primary/5 cursor-pointer">
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        </Card>


        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
        <FormField
          label="Height (hands)"
          required
          error={touched.height ? errors.height : undefined}
          description="Enter your horse's height in hands"
        >
          <Input
            type="number"
            step="0.1"
            min="10"
            max="20"
            value={formData.height || ''}
            onChange={(e) => handleFieldChange('height', parseFloat(e.target.value))}
            onBlur={() => setTouched(prev => ({ ...prev, height: true }))}
            placeholder="Enter height in hands"
            className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
            />
        </FormField>
        </Card>


        <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/10">
        <FormField
          label="Color"
          required
          error={touched.color ? errors.color : undefined}
          description="Select your horse's color"
        >
          <Select
            value={formData.color}
            onValueChange={(value) => handleFieldChange('color', value)}
          >
              <SelectTrigger className="h-12 bg-white/50 focus:bg-white transition-colors duration-300">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {HORSE_COLORS.map((color) => (
                <SelectItem key={color} value={color} className="focus:bg-primary/5 cursor-pointer">
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        </Card>

        <AnimatePresence>
          {Object.keys(errors).length > 0 && Object.values(touched).some(Boolean) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Please fix the following errors:</p>
              </div>
              <ul className="mt-2 space-y-1">
                {Object.entries(errors).map(([key, value]) => (
                  <motion.li
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm text-destructive"
                  >
                    {value}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FormStep>
  );
};

export default BasicInfoForm;
