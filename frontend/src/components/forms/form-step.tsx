import { ReactNode } from 'react';
import {
  Card,
  // CardContent,
  CardDescription,
  // CardFooter,
  // CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';


interface FormStepProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  isValid?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  description,
  children
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};


export const FormStep = ({
  currentStep,
  totalSteps,
  title,
  description,
  isValid = true,
  onNext,
  onPrev,
  onCancel,
  children
}: FormStepProps) => {
  return (
    <Card className="max-w-4xl mx-auto">
      <div className="space-y-6 p-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl font-light tracking-wide text-primary-dark">
                {title}
              </CardTitle>
              <CardDescription className="mt-2 text-sm tracking-wide">
                {description}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <motion.div
                key={index}
                className="h-2 rounded-full bg-primary/20"
                initial={false}
                animate={{
                  backgroundColor: index === currentStep - 1
                    ? 'rgb(var(--primary))'
                    : index < currentStep - 1
                      ? 'rgb(var(--primary)/0.8)'
                      : 'rgb(var(--primary)/0.2)'
                }}
              />
            ))}
          </div>
        </div>

        {children}

        <div className="flex justify-between items-center mt-8">
        <div className="flex gap-4">
          {currentStep === 1 ? (
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="text-muted-foreground hover:text-destructive"
            >
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onPrev}>
                Previous
              </Button>
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            </>
          )}
        </div>

            {onNext && (
              <Button
                onClick={onNext}
                disabled={!isValid}
                className={currentStep === totalSteps ? 'font-medium text-secondary' : 'font-medium text-secondary'}
              >
                {currentStep === totalSteps ? 'Complete' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
    </Card>
  );

};