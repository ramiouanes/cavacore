import { useState } from 'react';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Syringe, FileText, Calendar } from 'lucide-react';

interface Vaccination {
  id: string;
  type: string;
  date: string;
  nextDueDate: string;
  notes: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  veterinarian: string;
}

interface HealthData {
  generalHealth: string;
  vaccinations: Vaccination[];
  medicalRecords: MedicalRecord[];
  insuranceInfo: string;
  specialCare: string;
}

interface HealthRecordsFormProps {
  onSubmit: (data: HealthData) => void;
  onBack: () => void;
  initialData?: Partial<HealthData>;
}

const VACCINATION_TYPES = [
  'Influenza',
  'Tetanus',
  'Rabies',
  'West Nile Virus',
  'Rhinopneumonitis',
  'Strangles',
  'Other'
];

const MEDICAL_RECORD_TYPES = [
  'Routine Check-up',
  'Dental Care',
  'Injury Treatment',
  'Surgery',
  'X-Ray',
  'Blood Work',
  'Other'
];

export const HealthRecordsForm = ({ onSubmit, onBack, initialData = {} }: HealthRecordsFormProps) => {
  const [formData, setFormData] = useState<HealthData>({
    generalHealth: initialData ? initialData.generalHealth : '',
    vaccinations: initialData ? initialData.vaccinations : [],
    medicalRecords: initialData ? initialData.medicalRecords : [],
    insuranceInfo: initialData ? initialData.insuranceInfo : '',
    specialCare: initialData ? initialData.specialCare : '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof HealthData, string>>>({});

  const addVaccination = () => {
    const newVaccination: Vaccination = {
      id: crypto.randomUUID(),
      type: '',
      date: '',
      nextDueDate: '',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      vaccinations: [...prev.vaccinations, newVaccination],
    }));
  };

  const removeVaccination = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.filter(v => v.id !== id),
    }));
  };

  const updateVaccination = (id: string, field: keyof Vaccination, value: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.map(v =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const addMedicalRecord = () => {
    const newRecord: MedicalRecord = {
      id: crypto.randomUUID(),
      date: '',
      type: '',
      description: '',
      veterinarian: '',
    };
    setFormData(prev => ({
      ...prev,
      medicalRecords: [...prev.medicalRecords, newRecord],
    }));
  };

  const removeMedicalRecord = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicalRecords: prev.medicalRecords.filter(r => r.id !== id),
    }));
  };

  const updateMedicalRecord = (id: string, field: keyof MedicalRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof HealthData, string>> = {};

    if (!formData.generalHealth.trim()) {
      newErrors.generalHealth = 'General health information is required';
    }

    // Validate each vaccination record
    const invalidVaccinations = formData.vaccinations.some(
      v => !v.type || !v.date || !v.nextDueDate
    );
    if (invalidVaccinations) {
      newErrors.vaccinations = 'Please complete all vaccination records';
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
      title="Health Records"
      description="Enter health records and vaccination history"
      currentStep={4}
      totalSteps={5}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-6">
        <FormField label="General Health Status" required error={errors.generalHealth}>
          <Textarea
            value={formData.generalHealth}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, generalHealth: e.target.value }));
              if (errors.generalHealth) {
                setErrors(prev => ({ ...prev, generalHealth: undefined }));
              }
            }}
            placeholder="Describe the horse's general health status, including any chronic conditions or special considerations"
            className="h-32"
          />
        </FormField>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Syringe className="w-5 h-5" />
              Vaccinations
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={addVaccination}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Vaccination
            </Button>
          </div>

          {errors.vaccinations && (
            <p className="text-sm text-red-500">{errors.vaccinations}</p>
          )}

          <div className="space-y-4">
            {formData.vaccinations.map((vaccination) => (
              <Card key={vaccination.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField label="Vaccination Type">
                        <Select
                          value={vaccination.type}
                          onValueChange={(value) => updateVaccination(vaccination.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {VACCINATION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Date Administered">
                        <Input
                          type="date"
                          value={vaccination.date}
                          onChange={(e) => updateVaccination(vaccination.id, 'date', e.target.value)}
                        />
                      </FormField>
                      <FormField label="Next Due Date">
                        <Input
                          type="date"
                          value={vaccination.nextDueDate}
                          onChange={(e) => updateVaccination(vaccination.id, 'nextDueDate', e.target.value)}
                        />
                      </FormField>
                    </div>
                    <div className="relative">
                      <FormField label="Notes">
                        <Textarea
                          value={vaccination.notes}
                          onChange={(e) => updateVaccination(vaccination.id, 'notes', e.target.value)}
                          placeholder="Additional notes about the vaccination"
                          className="h-32"
                        />
                      </FormField>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => removeVaccination(vaccination.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Medical Records
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={addMedicalRecord}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Medical Record
            </Button>
          </div>

          <div className="space-y-4">
            {formData.medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField label="Date">
                        <Input
                          type="date"
                          value={record.date}
                          onChange={(e) => updateMedicalRecord(record.id, 'date', e.target.value)}
                        />
                      </FormField>
                      <FormField label="Record Type">
                        <Select
                          value={record.type}
                          onValueChange={(value) => updateMedicalRecord(record.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {MEDICAL_RECORD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Veterinarian">
                        <Input
                          value={record.veterinarian}
                          onChange={(e) => updateMedicalRecord(record.id, 'veterinarian', e.target.value)}
                          placeholder="Attending veterinarian"
                        />
                      </FormField>
                    </div>
                    <div className="relative">
                      <FormField label="Description">
                        <Textarea
                          value={record.description}
                          onChange={(e) => updateMedicalRecord(record.id, 'description', e.target.value)}
                          placeholder="Details of the medical record"
                          className="h-32"
                        />
                      </FormField>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => removeMedicalRecord(record.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <FormField label="Insurance Information">
          <Textarea
            value={formData.insuranceInfo}
            onChange={(e) => setFormData(prev => ({ ...prev, insuranceInfo: e.target.value }))}
            placeholder="Insurance provider, policy number, and coverage details"
            className="h-24"
          />
        </FormField>

        <FormField label="Special Care Requirements">
          <Textarea
            value={formData.specialCare}
            onChange={(e) => setFormData(prev => ({ ...prev, specialCare: e.target.value }))}
            placeholder="Any special care requirements or regular treatments needed"
            className="h-24"
          />
        </FormField>
      </div>
    </FormStep>
  );
};