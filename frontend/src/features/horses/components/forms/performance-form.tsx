import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus, Trophy, X } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { HorsePerformance, Achievement, DisciplineLevel } from '../../types';
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';


const DISCIPLINES = [
  'Dressage',
  'Show Jumping',
  'Eventing',
  'Western Pleasure',
  'Trail Riding',
  'Reining',
  'Barrel Racing',
  'Cross Country',
  'Endurance',
  'Vaulting',
  'Para-Equestrian',
  'Polo',
  'Cutting',
  'Driving'
];

interface PerformanceFormProps {
  onSubmit: (data: HorsePerformance) => void;
  onBack: () => void;
  initialData?: Partial<HorsePerformance>;
}

interface FormErrors {
  disciplines?: string;
  currentLevel?: string;
  achievements?: Record<string, string>;
}

export const PerformanceForm = ({
  onSubmit,
  onBack,
  initialData = {}
}: PerformanceFormProps) => {
  const [formData, setFormData] = useState<HorsePerformance>({
    disciplines: initialData.disciplines ?? [],
    currentLevel: initialData.currentLevel ?? DisciplineLevel.BEGINNER,
    trainingHistory: initialData.trainingHistory ?? '',
    achievements: initialData.achievements ?? []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (touched.disciplines && (!formData.disciplines.length || formData.disciplines.length > 3)) {
      newErrors.disciplines = 'Please select 1-3 disciplines';
      isValid = false;
    }

    if (touched.currentLevel && !formData.currentLevel) {
      newErrors.currentLevel = 'Please select a current level';
      isValid = false;
    }

    const achievementErrors: Record<string, string> = {};
    formData.achievements.forEach((achievement, index) => {
      if (touched[`achievement-${achievement.id}`]) {
        if (!achievement.title) {
          achievementErrors[achievement.id] = 'Title is required';
          isValid = false;
        }
        if (!achievement.date) {
          achievementErrors[achievement.id] = 'Date is required';
          isValid = false;
        }
      }
    });

    if (Object.keys(achievementErrors).length > 0) {
      newErrors.achievements = achievementErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      validateForm();
    }
  }, [formData, touched]);

  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: uuidv4(),
      title: '',
      date: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, newAchievement]
    }));
  };

  const removeAchievement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter(a => a.id !== id)
    }));
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map(a =>
        a.id === id ? { ...a, [field]: value } : a
      )
    }));
    setTouched(prev => ({ ...prev, [`achievement-${id}`]: true }));
  };

  const handleDisciplineChange = (discipline: string) => {
    setFormData(prev => {
      const disciplines = prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline].slice(0, 3);
      return { ...prev, disciplines };
    });
    setTouched(prev => ({ ...prev, disciplines: true }));
  };

  const handleSubmit = () => {
    setTouched(prev => ({
      ...prev,
      disciplines: true,
      currentLevel: true,
      ...formData.achievements.reduce((acc, achievement) => ({
        ...acc,
        [`achievement-${achievement.id}`]: true
      }), {})
    }));

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
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 bg-white/50 backdrop-blur-sm">
          <FormField
            label="Disciplines"
            required
            error={touched.disciplines ? errors.disciplines : undefined}
            description="Select up to 3 disciplines"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DISCIPLINES.map((discipline) => (
                <Button
                  key={discipline}
                  variant={formData.disciplines.includes(discipline) ? "default" : "outline"}
                  className={cn(
                    "justify-start transition-all duration-300",
                    formData.disciplines.includes(discipline)
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "hover:bg-primary/5"
                  )}
                  onClick={() => handleDisciplineChange(discipline)}
                >
                  <motion.span
                    initial={false}
                    animate={{
                      scale: formData.disciplines.includes(discipline) ? 1.05 : 1,
                      fontWeight: formData.disciplines.includes(discipline) ? 500 : 400
                    }}
                    className="truncate"
                  >
                    {discipline}
                  </motion.span>
                </Button>
              ))}
            </div>
          </FormField>
        </Card>

        <Card className="p-6">
          <FormField
            label="Current Performance Level"
            required
            error={touched.currentLevel ? errors.currentLevel : undefined}
          >
            <Select
              value={formData.currentLevel}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, currentLevel: value as DisciplineLevel }));
                setTouched(prev => ({ ...prev, currentLevel: true }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select current level" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DisciplineLevel).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Card>

        <Card className="p-6">
          <FormField label="Training History">
            <Textarea
              value={formData.trainingHistory}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                trainingHistory: e.target.value
              }))}
              placeholder="Describe the horse's training history and experience"
              className="h-32"
            />
          </FormField>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">Achievements</h3>
            </div>
            <Button
              onClick={addAchievement}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Achievement
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {formData.achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="bg-white/50 backdrop-blur-sm hover:shadow-soft transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <FormField
                          label="Achievement Title"
                          required
                          error={
                            touched[`achievement-${achievement.id}`]
                              ? errors.achievements?.[achievement.id]
                              : undefined
                          }
                        >
                          <Input
                            value={achievement.title}
                            onChange={(e) => updateAchievement(
                              achievement.id,
                              'title',
                              e.target.value
                            )}
                            placeholder="Competition or achievement name"
                          />
                        </FormField>

                        <FormField label="Date" required>
                          <DatePicker
                            date={achievement.date ? new Date(achievement.date) : undefined}
                            onSelect={(date) => updateAchievement(
                              achievement.id,
                              'date',
                              date?.toISOString() || ''
                            )}
                          />
                        </FormField>
                      </div>

                      <div className="relative">
                        <FormField label="Description">
                          <Textarea
                            value={achievement.description}
                            onChange={(e) => updateAchievement(
                              achievement.id,
                              'description',
                              e.target.value
                            )}
                            placeholder="Details about the achievement"
                            className="h-32"
                          />
                        </FormField>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2"
                          onClick={() => removeAchievement(achievement.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

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
                    {typeof value === 'string' ? value : 'Please complete all achievement fields'}
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

export default PerformanceForm;