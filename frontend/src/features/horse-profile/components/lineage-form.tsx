import { useState } from 'react';
import { FormStep, FormField } from '../../../components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, BookOpen, Award, History } from 'lucide-react';

interface PedigreeEntry {
  id: string;
  name: string;
  breed: string;
  registrationNumber?: string;
  achievements?: string;
  notes?: string;
}

interface LineageData {
  sire: PedigreeEntry | null;
  dam: PedigreeEntry | null;
  grandparents: {
    paternalGrandsire: PedigreeEntry | null;
    paternalGranddam: PedigreeEntry | null;
    maternalGrandsire: PedigreeEntry | null;
    maternalGranddam: PedigreeEntry | null;
  };
  registrationNumber: string;
  breedingHistory: string;
  bloodlineNotes: string;
  notableAncestors: PedigreeEntry[];
}

interface LineageFormProps {
  onSubmit: (data: LineageData) => void;
  onBack: () => void;
  initialData?: Partial<LineageData>;
}

const createEmptyPedigreeEntry = (): PedigreeEntry => ({
  id: crypto.randomUUID(),
  name: '',
  breed: '',
  registrationNumber: '',
  achievements: '',
  notes: '',
});

export const LineageForm = ({ onSubmit, onBack, initialData = {} }: LineageFormProps) => {
  const [formData, setFormData] = useState<LineageData>({
    sire: initialData ? initialData.sire : null,
    dam: initialData ? initialData.dam : null,
    grandparents: initialData ? initialData.grandparents : {
      paternalGrandsire: null,
      paternalGranddam: null,
      maternalGrandsire: null,
      maternalGranddam: null,
    },
    registrationNumber: initialData ? initialData.registrationNumber : '',
    breedingHistory: initialData ? initialData.breedingHistory : '',
    bloodlineNotes: initialData ? initialData.bloodlineNotes : '',
    notableAncestors: initialData ? initialData.notableAncestors : [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LineageData, string>>>({});

  const addNotableAncestor = () => {
    setFormData(prev => ({
      ...prev,
      notableAncestors: [...prev.notableAncestors, createEmptyPedigreeEntry()],
    }));
  };

  const removeNotableAncestor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      notableAncestors: prev.notableAncestors.filter(a => a.id !== id),
    }));
  };

  const updatePedigreeEntry = (
    type: 'sire' | 'dam' | 'notableAncestors',
    id: string,
    field: keyof PedigreeEntry,
    value: string
  ) => {
    if (type === 'notableAncestors') {
      setFormData(prev => ({
        ...prev,
        notableAncestors: prev.notableAncestors.map(a =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type]: prev[type] ? { ...prev[type]!, [field]: value } : createEmptyPedigreeEntry(),
      }));
    }
  };

  const PedigreeEntryForm = ({ 
    entry, 
    onChange, 
    onRemove,
    showRemove = false,
    required = false 
  }: { 
    entry: PedigreeEntry | null;
    onChange: (field: keyof PedigreeEntry, value: string) => void;
    onRemove?: () => void;
    showRemove?: boolean;
    required?: boolean;
  }) => (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField label="Name" required={required}>
              <Input
                value={entry?.name || ''}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Horse's name"
              />
            </FormField>
            <FormField label="Breed" required={required}>
              <Input
                value={entry?.breed || ''}
                onChange={(e) => onChange('breed', e.target.value)}
                placeholder="Horse's breed"
              />
            </FormField>
            <FormField label="Registration Number">
              <Input
                value={entry?.registrationNumber || ''}
                onChange={(e) => onChange('registrationNumber', e.target.value)}
                placeholder="Registration number (if available)"
              />
            </FormField>
          </div>
          <div className="space-y-4">
            <FormField label="Achievements">
              <Textarea
                value={entry?.achievements || ''}
                onChange={(e) => onChange('achievements', e.target.value)}
                placeholder="Notable achievements"
                className="h-24"
              />
            </FormField>
            <FormField label="Additional Notes">
              <Textarea
                value={entry?.notes || ''}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Additional information"
                className="h-24"
              />
            </FormField>
          </div>
        </div>
        {showRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LineageData, string>> = {};

    if (!formData.registrationNumber?.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }
    if (!formData.sire?.name || !formData.sire?.breed) {
      newErrors.sire = 'Sire information is required';
    }
    if (!formData.dam?.name || !formData.dam?.breed) {
      newErrors.dam = 'Dam information is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <FormStep
      title="Lineage Information"
      description="Enter details about the horse's pedigree and breeding history"
      currentStep={5}
      totalSteps={5}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-8">
        <FormField 
          label="Registration Number" 
          required 
          error={errors.registrationNumber}
        >
          <Input
            value={formData.registrationNumber}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, registrationNumber: e.target.value }));
              if (errors.registrationNumber) {
                setErrors(prev => ({ ...prev, registrationNumber: undefined }));
              }
            }}
            placeholder="Official registration number"
          />
        </FormField>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Parents
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium mb-2">Sire (Father)</h4>
              {errors.sire && <p className="text-sm text-red-500 mb-2">{errors.sire}</p>}
              <PedigreeEntryForm
                entry={formData.sire}
                onChange={(field, value) => updatePedigreeEntry('sire', '', field, value)}
                required
              />
            </div>

            <div>
              <h4 className="text-md font-medium mb-2">Dam (Mother)</h4>
              {errors.dam && <p className="text-sm text-red-500 mb-2">{errors.dam}</p>}
              <PedigreeEntryForm
                entry={formData.dam}
                onChange={(field, value) => updatePedigreeEntry('dam', '', field, value)}
                required
              />
            </div>
          </div>
        </div>

        <FormField label="Breeding History">
          <Textarea
            value={formData.breedingHistory}
            onChange={(e) => setFormData(prev => ({ ...prev, breedingHistory: e.target.value }))}
            placeholder="Details about breeding history and any offspring"
            className="h-32"
          />
        </FormField>

        <FormField label="Bloodline Notes">
          <Textarea
            value={formData.bloodlineNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, bloodlineNotes: e.target.value }))}
            placeholder="Additional information about the bloodline"
            className="h-32"
          />
        </FormField>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Award className="w-5 h-5" />
              Notable Ancestors
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={addNotableAncestor}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Ancestor
            </Button>
          </div>

          <div className="space-y-4">
            {formData.notableAncestors.map((ancestor) => (
              <PedigreeEntryForm
                key={ancestor.id}
                entry={ancestor}
                onChange={(field, value) => updatePedigreeEntry('notableAncestors', ancestor.id, field, value)}
                onRemove={() => removeNotableAncestor(ancestor.id)}
                showRemove
              />
            ))}
          </div>
        </div>
      </div>
    </FormStep>
  );
};