import { useState } from 'react';
import { FormStep, FormField } from '../../../components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Trophy, Award } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface PerformanceData {
  disciplines: string[];
  currentLevel: string;
  trainingHistory: string;
  achievements: Achievement[];
}

interface PerformanceFormProps {
  onSubmit: (data: PerformanceData) => void;
  onBack: () => void;
  initialData?: Partial<PerformanceData>;
}

const DISCIPLINES = [
  'Dressage',
  'Show Jumping',
  'Eventing',
  'Western Pleasure',
  'Trail Riding',
  'Reining',
  'Endurance',
  'Vaulting',
];

const PERFORMANCE_LEVELS = [
  'Beginner',
  'Novice',
  'Intermediate',
  'Advanced',
  'Professional',
  'Elite',
];

export const PerformanceForm = ({ onSubmit, onBack, initialData = {} }: PerformanceFormProps) => {
  const [formData, setFormData] = useState<PerformanceData>({
    disciplines: initialData ? initialData.disciplines : [],
    currentLevel: initialData ? initialData.trainingHistory : '',
    trainingHistory: initialData ? initialData.trainingHistory : '',
    achievements: initialData ? initialData.achievements : [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PerformanceData, string>>>({});

  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: crypto.randomUUID(),
      title: '',
      date: '',
      description: '',
    };
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, newAchievement],
    }));
  };

  const removeAchievement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter(a => a.id !== id),
    }));
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map(a =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PerformanceData, string>> = {};

    if (formData.disciplines.length === 0) {
      newErrors.disciplines = 'Select at least one discipline';
    }
    if (!formData.currentLevel) {
      newErrors.currentLevel = 'Current level is required';
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
      title="Performance Details"
      description="Enter your horse's disciplines and achievements"
      currentStep={3}
      totalSteps={5}
      isValid={Object.keys(errors).length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-6">
        <FormField label="Disciplines" required error={errors.disciplines}>
          <Select
            value={formData.disciplines[0]}
            onValueChange={(value) => {
              setFormData(prev => ({
                ...prev,
                disciplines: [value, ...prev.disciplines.slice(1)],
              }));
              if (errors.disciplines) {
                setErrors(prev => ({ ...prev, disciplines: undefined }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary discipline" />
            </SelectTrigger>
            <SelectContent>
              {DISCIPLINES.map((discipline) => (
                <SelectItem key={discipline} value={discipline}>
                  {discipline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="mt-2">
            <Select
              value={formData.disciplines[1] || ''}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  disciplines: [prev.disciplines[0], value],
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select secondary discipline (optional)" />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.filter(d => d !== formData.disciplines[0]).map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormField>

        <FormField label="Current Performance Level" required error={errors.currentLevel}>
          <Select
            value={formData.currentLevel}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, currentLevel: value }));
              if (errors.currentLevel) {
                setErrors(prev => ({ ...prev, currentLevel: undefined }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select current level" />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Training History">
          <Textarea
            value={formData.trainingHistory}
            onChange={(e) => setFormData(prev => ({ ...prev, trainingHistory: e.target.value }))}
            placeholder="Describe the horse's training history and experience"
            className="h-32"
          />
        </FormField>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={addAchievement}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Achievement
            </Button>
          </div>

          <div className="space-y-4">
            {formData.achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField label="Achievement Title">
                        <Input
                          value={achievement.title}
                          onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                          placeholder="Competition or achievement name"
                        />
                      </FormField>
                      <FormField label="Date">
                        <Input
                          type="date"
                          value={achievement.date}
                          onChange={(e) => updateAchievement(achievement.id, 'date', e.target.value)}
                        />
                      </FormField>
                    </div>
                    <div className="relative">
                      <FormField label="Description">
                        <Textarea
                          value={achievement.description}
                          onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                          placeholder="Details about the achievement"
                          className="h-32"
                        />
                      </FormField>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => removeAchievement(achievement.id)}
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
      </div>
    </FormStep>
  );
};