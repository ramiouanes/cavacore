import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FormStepProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  isValid?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  children: ReactNode;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export const FormField = ({ label, required, error, children }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const FormStep = ({
  title,
  description,
  currentStep,
  totalSteps,
  isValid = true,
  onNext,
  onPrev,
  children,
}: FormStepProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {children}
      </CardContent>

      <CardFooter className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 1}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!isValid || currentStep === totalSteps}
          className="flex items-center"
        >
          {currentStep === totalSteps ? 'Submit' : 'Next'}
          {currentStep !== totalSteps && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </CardFooter>
    </Card>
  );
};