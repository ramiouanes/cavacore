import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dealService } from '../../services/deal-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { DealStage, DealType, StageRequirement } from '../../types/deal.types';


interface StageTransitionFormProps {
  currentStage: DealStage;
  targetStage: DealStage;
  dealType: DealType;
  dealId: string;
  requirements: StageRequirement[];
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  validationErrors?: string[];
  warnings?: string[];
}

export function StageTransitionForm({
  currentStage,
  targetStage,
  dealType,
  dealId,
  requirements,
  onConfirm,
  onCancel,
  validationErrors = [],
  warnings = []
}: StageTransitionFormProps) {
  const [reason, setReason] = useState('');
  const [showDialog, setShowDialog] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setIsLoading(true);

      // First validate the transition
      const validation = await dealService.validateStage(dealId, targetStage);

      if (!validation.canProgress) {
        toast({
          title: "Cannot Progress",
          description: validation.validationErrors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // If validation passes, attempt to update the stage
      await dealService.updateStage(dealId, targetStage);

      toast({
        title: "Stage Updated",
        description: `Successfully transitioned to ${targetStage}`,
      });

      onConfirm(reason);
      setShowDialog(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update stage",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMissingRequirements = () => {
    return requirements.filter(req => 
      validationErrors.some(error => error.toLowerCase().includes(req.description.toLowerCase()))
    );
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Stage Transition
            <Badge variant="outline" className="ml-2">
              {currentStage} <ArrowRight className="w-4 h-4 mx-1" /> {targetStage}
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <Card className="p-4 space-y-2">
              <h4 className="font-medium">Stage Requirements</h4>
              <div className="space-y-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {!getMissingRequirements().includes(req) ? (
                      <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-1 text-destructive" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm">{req.description}</span>
                      {req.type === 'document' && getMissingRequirements().includes(req) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Required document missing
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {validationErrors.length > 0 && (
              <Card className="p-4 border-destructive">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Validation Errors
                </h4>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {warnings.length > 0 && (
              <Card className="p-4 border-yellow-500">
                <h4 className="font-medium text-yellow-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Warnings
                </h4>
                <ul className="mt-2 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-500">
                      {warning}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for Transition
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this stage transition..."
                className="min-h-[100px]"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={validationErrors.length > 0 || !reason.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating Stage...
              </>
            ) : (
              'Confirm Transition'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}