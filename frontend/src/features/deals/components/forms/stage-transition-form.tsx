// src/features/deals/components/forms/stage-transition-form.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { DealStage, DealType, StageRequirement } from '../../types/deal.types';
import { dealTypeUtils } from '../../utils/deal-type-utils';
import { useToast } from '@/hooks/use-toast';
import { dealService } from '../../services/deal-service';
import { StageRequirementsChecklist } from './stage-requirements-checklist';
import { Timeline } from '../common/timeline';

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
  const [stageMetrics, setStageMetrics] = useState<any>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const validation = await dealService.validateStage(dealId, targetStage);
        const nextStage = dealTypeUtils.getConfig(dealType).stages[
          dealTypeUtils.getConfig(dealType).stages.indexOf(currentStage) + 1
        ];
        setStageMetrics({
          nextStage,
          progress: validation.progress,
          canProgress: validation.canProgress,
          requirements: validation.missingRequirements
        });
      } catch (error) {
        console.error('Error loading stage metrics:', error);
      }
    };
    loadMetrics();
  }, [dealId, currentStage, targetStage, dealType]);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const validation = await dealService.validateStage(dealId, targetStage);

      if (!validation.canProgress && !window.confirm('Requirements not met. Continue anyway?')) {
        return;
      }

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
            {/* Stage Metrics */}
            {stageMetrics && (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Stage Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{stageMetrics.progress}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Next Stage</span>
                    <span>{stageMetrics.nextStage}</span>
                  </div>
                  {stageMetrics.requirements.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Missing Requirements:</span>
                      <ul className="list-disc list-inside mt-1">
                        {stageMetrics.requirements.map((req: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Requirements Checklist */}
            <StageRequirementsChecklist
              stage={targetStage}
              dealType={dealType}
              requirements={requirements}
              completedRequirements={[]}
            />

            {/* Validation Messages */}
            {validationErrors.length > 0 && (
              <Card className="p-4 border-destructive">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Validation Errors
                </h4>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">{error}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Transition Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Transition</label>
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
            disabled={!reason.trim() || isLoading}
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