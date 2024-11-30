import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GalleryVerticalEnd, AlertCircle } from 'lucide-react';
import { HorseLineage, PedigreeEntry } from '../../types';
import { PedigreeTree } from './pedigree-tree';
import { v4 as uuidv4 } from 'uuid';


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

export interface LineageFormProps {
  onSubmit: (data: HorseLineage) => void;
  onBack: () => void;
  initialData?: Partial<HorseLineage>;
  basicInfo: {
    name: string;
    breed: string;
  };
}


export function LineageForm({ onSubmit, onBack, initialData = {} }: LineageFormProps) {
  const [formData, setFormData] = useState<HorseLineage>({
    registrationNumber: initialData.registrationNumber ?? '',
    passportNumber: initialData.passportNumber ?? '',
    sire: initialData.sire ?? {
      id: uuidv4(),
      name: '',
      breed: '',
      achievements: '',
      notes: ''
    },
    dam: initialData.dam ?? {
      id: uuidv4(),
      name: '',
      breed: '',
      achievements: '',
      notes: ''
    },
    breedingHistory: initialData.breedingHistory ?? '',
    bloodlineNotes: initialData.bloodlineNotes ?? ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof HorseLineage | 'sire.name' | 'sire.breed' | 'dam.name' | 'dam.breed', string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = (field: string, value: any): string | undefined => {
    if (field === 'registrationNumber') {
      if (!value?.trim()) return 'Registration number is required';
      if (value.length < 3) return 'Registration number must be at least 3 characters';
      return undefined;
    }

    if (field === 'sire.name' || field === 'dam.name') {
      if (!value?.trim()) return `${field === 'sire.name' ? 'Sire' : 'Dam'} name is required`;
      return undefined;
    }

    if (field === 'sire.breed' || field === 'dam.breed') {
      if (!value?.trim()) return `${field === 'sire.breed' ? 'Sire' : 'Dam'} breed is required`;
      return undefined;
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate registration number
    const registrationError = validateField('registrationNumber', formData.registrationNumber);
    if (registrationError) newErrors.registrationNumber = registrationError;

    // Validate sire
    const sireNameError = validateField('sire.name', formData.sire.name);
    if (sireNameError) newErrors['sire.name'] = sireNameError;

    const sireBreedError = validateField('sire.breed', formData.sire.breed);
    if (sireBreedError) newErrors['sire.breed'] = sireBreedError;

    // Validate dam
    const damNameError = validateField('dam.name', formData.dam.name);
    if (damNameError) newErrors['dam.name'] = damNameError;

    const damBreedError = validateField('dam.breed', formData.dam.breed);
    if (damBreedError) newErrors['dam.breed'] = damBreedError;

    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  };

  const updatePedigreeEntry = (
    type: 'sire' | 'dam',
    field: keyof PedigreeEntry,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setTouched(prev => ({ ...prev, [`${type}.${field}`]: true }));
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateForm();
    }
  }, [formData]);

  const handleSubmit = () => {
    setTouched({
      registrationNumber: true,
      'sire.name': true,
      'sire.breed': true,
      'dam.name': true,
      'dam.breed': true
    });

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <FormStep
      title="Lineage & Breeding"
      description="Document your horse's ancestry and breeding information"
      currentStep={5}
      totalSteps={5}
      isValid={isValid}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >

        {/* Registration Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <GalleryVerticalEnd className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Registration Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Registration Number" 
              required 
              error={touched.registrationNumber ? errors.registrationNumber : undefined}
              description="Official registration number from breed registry"
            >
              <Input
                value={formData.registrationNumber}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, registrationNumber: e.target.value }));
                  setTouched(prev => ({ ...prev, registrationNumber: true }));
                }}
                placeholder="Enter registration number"
              />
            </FormField>

            <FormField 
              label="Passport Number"
              description="Optional horse passport identification"
            >
              <Input
                value={formData.passportNumber}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  passportNumber: e.target.value 
                }))}
                placeholder="Enter passport number (optional)"
              />
            </FormField>
          </div>
        </Card>

        {/* Sire Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <GalleryVerticalEnd className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Sire Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Sire's Name" 
              required
              error={touched['sire.name'] ? errors['sire.name'] : undefined}
            >
              <Input
                value={formData.sire.name}
                onChange={(e) => updatePedigreeEntry('sire', 'name', e.target.value)}
                placeholder="Enter sire's name"
              />
            </FormField>

            <FormField 
              label="Sire's Breed" 
              required
              error={touched['sire.breed'] ? errors['sire.breed'] : undefined}
            >
              <Select
                value={formData.sire.breed}
                onValueChange={(value) => updatePedigreeEntry('sire', 'breed', value)}
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

            <div className="md:col-span-2">
              <FormField 
                label="Sire's Achievements"
                description="Notable achievements and performance history"
              >
                <Textarea
                  value={formData.sire.achievements}
                  onChange={(e) => updatePedigreeEntry('sire', 'achievements', e.target.value)}
                  placeholder="Enter sire's achievements"
                  className="h-24"
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Dam Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <GalleryVerticalEnd className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Dam Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Dam's Name" 
              required
              error={touched['dam.name'] ? errors['dam.name'] : undefined}
            >
              <Input
                value={formData.dam.name}
                onChange={(e) => updatePedigreeEntry('dam', 'name', e.target.value)}
                placeholder="Enter dam's name"
              />
            </FormField>

            <FormField 
              label="Dam's Breed" 
              required
              error={touched['dam.breed'] ? errors['dam.breed'] : undefined}
            >
              <Select
                value={formData.dam.breed}
                onValueChange={(value) => updatePedigreeEntry('dam', 'breed', value)}
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

            <div className="md:col-span-2">
              <FormField 
                label="Dam's Achievements"
                description="Notable achievements and performance history"
              >
                <Textarea
                  value={formData.dam.achievements}
                  onChange={(e) => updatePedigreeEntry('dam', 'achievements', e.target.value)}
                  placeholder="Enter dam's achievements"
                  className="h-24"
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Breeding Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <GalleryVerticalEnd className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Breeding Information</h3>
          </div>

          <div className="space-y-4">
            <FormField 
              label="Breeding History"
              description="Past breeding record and offspring details"
            >
              <Textarea
                value={formData.breedingHistory}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  breedingHistory: e.target.value 
                }))}
                placeholder="Enter breeding history"
                className="h-24"
              />
            </FormField>

            <FormField 
              label="Bloodline Notes"
              description="Additional information about ancestry and bloodlines"
            >
              <Textarea
                value={formData.bloodlineNotes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  bloodlineNotes: e.target.value 
                }))}
                placeholder="Enter bloodline notes"
                className="h-24"
              />
            </FormField>
          </div>
        </Card>

        {/* Pedigree Tree Visualization */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <GalleryVerticalEnd className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Family Tree</h3>
          </div>
          <PedigreeTree
            sire={formData.sire}
            dam={formData.dam}
            horseName="Horse"
            horseBreed="Breed"
          />
        </Card>

        {/* Error Summary */}
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
}