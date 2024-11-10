import { useState } from 'react';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicInfoFormData {
  name: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  color: string;
}

interface BasicInfoFormProps {
  onSubmit: (data: BasicInfoFormData) => void;
  onBack?: () => void;
  initialData?: Partial<BasicInfoFormData>;
}

const HORSE_BREEDS = [
  'Thoroughbred',
  'Arabian',
  'Quarter Horse',
  'Warmblood',
  'Friesian',
  'Andalusian',
  // Add more breeds as needed
];

const HORSE_GENDERS = [
  'Mare',
  'Stallion',
  'Gelding'
];

const HORSE_COLORS = [
  'Bay',
  'Chestnut',
  'Black',
  'Grey',
  'Palomino',
  'Pinto',
  // Add more colors as needed
];

export const BasicInfoForm = ({ onSubmit, onBack, initialData = {} }: BasicInfoFormProps) => {
  const [formData, setFormData] = useState<BasicInfoFormData>({
    name: initialData ? initialData.name : '',
    breed: initialData ? initialData.breed : '',
    dateOfBirth: initialData ? initialData.dateOfBirth : '',
    gender: initialData ? initialData.gender : '',
    height: initialData ? initialData.height : '',
    color: initialData ? initialData.color : '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BasicInfoFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.breed) {
      newErrors.breed = 'Breed is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.height) {
      newErrors.height = 'Height is required';
    }
    if (!formData.color) {
      newErrors.color = 'Color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof BasicInfoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      <FormField label="Horse Name" required error={errors.name}>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter horse's name"
          className="w-full"
        />
      </FormField>

      <FormField label="Breed" required error={errors.breed}>
        <Select
          value={formData.breed}
          onValueChange={(value) => handleInputChange('breed', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select breed" />
          </SelectTrigger>
          <SelectContent>
            {HORSE_BREEDS.map((breed) => (
              <SelectItem key={breed} value={breed}>
                {breed}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Date of Birth" required error={errors.dateOfBirth}>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          className="w-full"
        />
      </FormField>

      <FormField label="Gender" required error={errors.gender}>
        <Select
          value={formData.gender}
          onValueChange={(value) => handleInputChange('gender', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            {HORSE_GENDERS.map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Height (hands)" required error={errors.height}>
        <Input
          type="number"
          step="0.1"
          min="10"
          max="20"
          value={formData.height}
          onChange={(e) => handleInputChange('height', e.target.value)}
          placeholder="Enter height in hands"
          className="w-full"
        />
      </FormField>

      <FormField label="Color" required error={errors.color}>
        <Select
          value={formData.color}
          onValueChange={(value) => handleInputChange('color', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {HORSE_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </FormStep>
  );
};