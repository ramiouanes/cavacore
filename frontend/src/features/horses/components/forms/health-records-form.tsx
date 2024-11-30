// src/features/horses/components/forms/health-records-form.tsx

import { useState, useEffect } from 'react';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Syringe, FileText, Upload, AlertCircle } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone } from 'react-dropzone';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Vaccination, 
  MedicalRecord, 
  VetRecord,
  VetRecordFile,
  HorseHealth 
} from '../../types';
import { v4 as uuidv4 } from 'uuid';


interface HealthRecordsFormProps {
  onSubmit: (data: HorseHealth) => void;
  onBack: () => void;
  initialData?: Partial<HorseHealth>;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

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
  'Ultrasound',
  'Scope',
  'Surgery',
  'X-Ray',
  'Blood Work',
  'Other'
];

export const HealthRecordsForm = ({ 
  onSubmit, 
  onBack, 
  initialData = {} 
}: HealthRecordsFormProps) => {
  const [formData, setFormData] = useState<HorseHealth>({
    generalHealth: initialData.generalHealth ?? '',
    vaccinations: initialData.vaccinations ?? [],
    medicalRecords: initialData.medicalRecords ?? [],
    insuranceInfo: initialData.insuranceInfo ?? '',
    specialCare: initialData.specialCare ?? '',
    vetRecords: initialData.vetRecords ?? []
  });

  const [errors, setErrors] = useState<Partial<Record<keyof HorseHealth, string>>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isValid, setIsValid] = useState(false);

  // File upload handling
  const onDrop = async (recordId: string, acceptedFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      vetRecords: prev.vetRecords.map(record => {
        if (record.id === recordId) {
          const newFiles: VetRecordFile[] = acceptedFiles.map(file => ({
            file,
            originalName: file.name,
            preview: URL.createObjectURL(file)
          }));
          return {
            ...record,
            files: [...(record.files || []), ...newFiles]
          };
        }
        return record;
      })
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDrop: files => onDrop('temp', files) // This will be updated when used
  });

  // Record management functions
  const addVaccination = () => {
    const newVaccination: Vaccination = {
      id: uuidv4(),
      type: '',
      date: '',
      nextDueDate: '',
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      vaccinations: [...prev.vaccinations, newVaccination]
    }));
  };

  const addMedicalRecord = () => {
    const newRecord: MedicalRecord = {
      id: uuidv4(),
      date: '',
      type: '',
      description: '',
      veterinarian: ''
    };
    setFormData(prev => ({
      ...prev,
      medicalRecords: [...prev.medicalRecords, newRecord]
    }));
  };

  const addVetRecord = () => {
    const newRecord: VetRecord = {
      id: uuidv4(),
      date: '',
      type: '',
      description: '',
      files: []
    };
    setFormData(prev => ({
      ...prev,
      vetRecords: [...prev.vetRecords, newRecord]
    }));
  };

  // Remove functions with animations
  const removeVaccination = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.filter(v => v.id !== id)
    }));
  };

  const removeMedicalRecord = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicalRecords: prev.medicalRecords.filter(r => r.id !== id)
    }));
  };

  const removeVetRecord = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vetRecords: prev.vetRecords.filter(r => r.id !== id)
    }));
  };

  const removeVetFile = (recordId: string, fileIndex: number) => {
    setFormData(prev => ({
      ...prev,
      vetRecords: prev.vetRecords.map(record => {
        if (record.id === recordId) {
          const newFiles = [...record.files];
          const removedFile = newFiles[fileIndex];
          if (removedFile.preview) {
            URL.revokeObjectURL(removedFile.preview);
          }
          newFiles.splice(fileIndex, 1);
          return { ...record, files: newFiles };
        }
        return record;
      })
    }));
  };

  // Update functions
  const updateVaccination = (id: string, field: keyof Vaccination, value: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.map(v =>
        v.id === id ? { ...v, [field]: value } : v
      )
    }));
  };

  const updateMedicalRecord = (id: string, field: keyof MedicalRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
  };

  const updateVetRecord = (id: string, field: keyof VetRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      vetRecords: prev.vetRecords.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof HorseHealth, string>> = {};

    if (!formData.generalHealth.trim()) {
      newErrors.generalHealth = 'General health information is required';
    }

    const invalidVaccinations = formData.vaccinations.some(
      v => !v.type || !v.date || !v.nextDueDate
    );
    if (invalidVaccinations) {
      newErrors.vaccinations = 'Please complete all vaccination records';
    }

    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup file previews
      formData.vetRecords.forEach(record => {
        record.files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      });
    };
  }, []);

  return (
    <FormStep
      title="Health Records"
      description="Enter health records and vaccination history"
      currentStep={4}
      totalSteps={5}
      isValid={isValid}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-6">
        {/* General Health Section */}
        <Card className="p-6">
          <FormField 
            label="General Health Status" 
            required 
            error={errors.generalHealth}
          >
            <Textarea
              value={formData.generalHealth}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, generalHealth: e.target.value }));
                if (errors.generalHealth) {
                  setErrors(prev => ({ ...prev, generalHealth: undefined }));
                }
              }}
              placeholder="Describe the horse's general health status..."
              className="h-32"
            />
          </FormField>
        </Card>

        {/* Vaccinations Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Vaccinations</h3>
            </div>
            <Button
              onClick={addVaccination}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Vaccination
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {formData.vaccinations.map((vaccination) => (
              <motion.div
                key={vaccination.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField label="Type">
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
                        <DatePicker
                          date={vaccination.date ? new Date(vaccination.date) : undefined}
                          onSelect={(date) => updateVaccination(
                            vaccination.id, 
                            'date', 
                            date?.toISOString() || ''
                          )}
                        />
                      </FormField>
                      
                      <FormField label="Next Due Date">
                        <DatePicker
                          date={vaccination.nextDueDate ? new Date(vaccination.nextDueDate) : undefined}
                          onSelect={(date) => updateVaccination(
                            vaccination.id, 
                            'nextDueDate', 
                            date?.toISOString() || ''
                          )}
                        />
                      </FormField>
                    </div>
                    
                    <div className="relative">
                      <FormField label="Notes">
                        <Textarea
                          value={vaccination.notes}
                          onChange={(e) => updateVaccination(vaccination.id, 'notes', e.target.value)}
                          placeholder="Additional notes..."
                          className="h-32"
                        />
                      </FormField>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 right-0"
                        onClick={() => removeVaccination(vaccination.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Card>

        {/* Vet Records Section with File Upload */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Veterinary Records</h3>
            </div>
            <Button
              onClick={addVetRecord}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {formData.vetRecords.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField label="Date">
                        <DatePicker
                          date={record.date ? new Date(record.date) : undefined}
                          onSelect={(date) => updateVetRecord(
                            record.id,
                            'date',
                            date?.toISOString() || ''
                          )}
                        />
                      </FormField>

                      <FormField label="Record Type">
                        <Select
                          value={record.type}
                          onValueChange={(value) => updateVetRecord(record.id, 'type', value)}
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

                      <div 
                        {...getRootProps()} 
                        className={cn(
                          "border-2 border-dashed rounded-lg p-4 transition-colors",
                          isDragActive 
                            ? "border-primary bg-primary/5" 
                            : "border-gray-200 hover:border-primary/50"
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground text-center">
                            Drag & drop files or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, JPG, PNG (max 15MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormField label="Description">
                        <Textarea
                          value={record.description}
                          onChange={(e) => updateVetRecord(record.id, 'description', e.target.value)}
                          placeholder="Details of the veterinary record..."
                          className="h-32"
                        />
                      </FormField>

                      {/* File Preview Section */}
                      {record.files && record.files.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Attached Files</label>
                          <div className="grid grid-cols-2 gap-2">
                            {record.files.map((file, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative group"
                              >
                                <Card className="p-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-sm truncate">
                                      {file.originalName}
                                    </span>
                                  </div>
                                  
                                  {uploadProgress[`${record.id}-${index}`] !== undefined && (
                                    <Progress 
                                      value={uploadProgress[`${record.id}-${index}`]}
                                      className="mt-2"
                                    />
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeVetFile(record.id, index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeVetRecord(record.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Card>

        {/* Insurance Information */}
        <Card className="p-6">
          <FormField label="Insurance Information">
            <Textarea
              value={formData.insuranceInfo}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                insuranceInfo: e.target.value 
              }))}
              placeholder="Insurance provider, policy number, and coverage details..."
              className="h-24"
            />
          </FormField>
        </Card>

        {/* Special Care Requirements */}
        <Card className="p-6">
          <FormField label="Special Care Requirements">
            <Textarea
              value={formData.specialCare}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                specialCare: e.target.value 
              }))}
              placeholder="Any special care requirements or regular treatments needed..."
              className="h-24"
            />
          </FormField>
        </Card>

        {/* Form-wide error display */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Please fix the following errors:</p>
              </div>
              <ul className="mt-2 space-y-1">
                {Object.entries(errors).map(([key, value]) => (
                  <li key={key} className="text-sm text-destructive">
                    {value}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormStep>
  );
};