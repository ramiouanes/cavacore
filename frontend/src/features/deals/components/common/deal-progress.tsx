// src/features/deals/components/common/deal-progress.tsx

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  CheckCircle2,
  CircleDot,
  AlertCircle,
  ChevronRight,
  Clock,
  RotateCcw,
  XCircle,
  ChevronDown,
  Shield,
  LucideIcon
} from 'lucide-react';
import { DealType, DealStage, DealStatus, DEAL_STAGE_REQUIREMENTS, StageRequirement, Deal } from '../../types/deal.types';
import { dealTypeUtils } from '../../utils/deal-type-utils';
import { StageTransitionForm } from '../forms/stage-transition-form';
import { StageRequirementsChecklist } from '../forms/stage-requirements-checklist';
import { StageHistory } from './stage-history';
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dealService } from '../../services/deal-service';
import { toast } from '@/hooks/use-toast';

interface StageInfo {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface ValidationResult {
  canProgress: boolean;
  requirements: StageRequirement[];
  warnings: string[];
  validationErrors: string[];
}

interface DealProgressProps {
  deal: Deal,
  dealType: DealType;
  currentStage: DealStage;
  status: DealStatus;
  progress: number;
  stageProgress: Record<DealStage, number>;
  onStageClick?: (stage: DealStage) => void;
  className?: string;
  showDetails?: boolean;
}

interface TransitionConfirmation {
  show: boolean;
  targetStage: DealStage | null;
  requirements: StageRequirement[];
  warnings: string[];
  validationErrors: string[];
}

const STAGE_INFO: Record<DealStage, StageInfo> = {
  [DealStage.INITIATION]: {
    label: 'Initiation',
    description: 'Basic deal setup and participant invitation',
    icon: CircleDot,
    color: 'text-blue-500'
  },
  [DealStage.DISCUSSION]: {
    label: 'Discussion',
    description: 'Terms negotiation and agreement',
    icon: CircleDot,
    color: 'text-indigo-500'
  },
  [DealStage.EVALUATION]: {
    label: 'Evaluation',
    description: 'Inspections and assessments',
    icon: CircleDot,
    color: 'text-purple-500'
  },
  [DealStage.DOCUMENTATION]: {
    label: 'Documentation',
    description: 'Required document preparation and signing',
    icon: CircleDot,
    color: 'text-pink-500'
  },
  [DealStage.CLOSING]: {
    label: 'Closing',
    description: 'Final checks and deal completion',
    icon: CircleDot,
    color: 'text-red-500'
  },
  [DealStage.COMPLETE]: {
    label: 'Complete',
    description: 'Deal successfully completed',
    icon: CheckCircle2,
    color: 'text-green-500'
  }
};

export function DealProgress({
  deal,
  dealType,
  currentStage,
  status,
  progress,
  stageProgress,
  onStageClick,
  className,
  showDetails = false
}: DealProgressProps) {
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(
    status === DealStatus.ACTIVE ? currentStage : null
  );

  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  const [transitionConfirmation, setTransitionConfirmation] = useState<TransitionConfirmation>({
    show: false,
    targetStage: null,
    requirements: [],
    warnings: [],
    validationErrors: []
  });
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackStage, setRollbackStage] = useState<DealStage | null>(null);

  const dealConfig = dealTypeUtils.getConfig(dealType as any);
  const stages = dealConfig.stages;

  const getStageStatus = useCallback((stage: DealStage) => {
    const stageIndex = stages.indexOf(stage);
    const currentIndex = stages.indexOf(currentStage);

    if (status === DealStatus.COMPLETED && stage === DealStage.COMPLETE) return 'completed';
    if (stage === currentStage) return 'current';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex + 1 && status === DealStatus.ACTIVE) {
      return validateStageTransition(currentStage, stage).canProgress ? 'next' : 'blocked';
    }
    return 'pending';
  }, [stages, currentStage, status]);

  const rollbackMutation = useMutation({
    mutationFn: (stage: DealStage) =>
      dealService.updateStage(deal.id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', deal.id] });
      toast({
        title: 'Stage Rolled Back',
        description: 'Successfully rolled back to previous stage'
      });
    },

    onError: (error: any) => {
      toast({
        title: 'Rollback Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleRollback = async (stage: DealStage) => {
    try {
      await rollbackMutation.mutateAsync(stage);
      setShowRollbackDialog(false);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };




  const validateStageTransition = (fromStage: DealStage, toStage: DealStage): ValidationResult => {
    const stageRequirements = DEAL_STAGE_REQUIREMENTS[dealType][toStage] || [];
    const validation: ValidationResult = {
      canProgress: true,
      requirements: stageRequirements,
      warnings: [],
      validationErrors: []
    };

    // Check stage order
    if (Math.abs(stages.indexOf(toStage) - stages.indexOf(fromStage)) > 1) {
      validation.validationErrors = [...validation.validationErrors, 'Can only move one stage at a time'];
      validation.canProgress = false;
    }

    // Check stage requirements
    const missingReqs = stageRequirements.filter(req => {
      // Check if requirement is met based on progress
      const stageIndex = stages.indexOf(toStage);
      const reqProgress = ((stageIndex + 1) / stages.length) * 100;
      return (stageProgress[toStage] || 0) < reqProgress;
    });

    if (missingReqs.length > 0) {
      validation.requirements = missingReqs;
      validation.warnings = [...validation.warnings, 'Some requirements are not yet complete'];
    }

    // Check stage-specific validations
    const stageValidations = dealConfig.validations[toStage];
    if (stageValidations) {
      const errors = Object.entries(stageValidations)
        .filter(([_, validate]) => !validate(stageProgress[toStage]))
        .map(([field]) => `${field} requirement not met`);

      validation.validationErrors = [...validation.validationErrors, ...errors];
      validation.canProgress = validation.canProgress && errors.length === 0;
    }

    return validation;
  };

  const handleStageClick = (stage: DealStage) => {
    const config = dealTypeUtils.getConfig(dealType);
    const currentIndex = config.stages.indexOf(currentStage);
    const targetIndex = config.stages.indexOf(stage);
    
    // Only allow moving one stage forward or back
    if (Math.abs(targetIndex - currentIndex) !== 1) {
      return;
    }
  
    const validation = validateStageTransition(currentStage, stage);
    setTransitionConfirmation({
      show: true,
      targetStage: stage,
      requirements: validation.requirements,
      warnings: validation.warnings,
      validationErrors: validation.validationErrors
    });
  };



  // const handleRollback = (stage: DealStage) => {
  //   setRollbackStage(stage);
  //   setShowRollbackDialog(true);
  // };

  const renderProgressIndicator = (value: number, label?: string) => (
    <div className="relative pt-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold inline-block text-primary">
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-primary">
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 text-xs flex rounded bg-primary/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rgb(var(--primary))"
        />
      </div>
    </div>
  );

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Deal Progress</h3>
            <Badge
              variant="outline"
              className={`gap-1.5
                ${status === DealStatus.ACTIVE ? 'bg-blue-500/10 text-blue-500' : ''}
                ${status === DealStatus.COMPLETED ? 'bg-green-500/10 text-green-500' : ''}
                ${status === DealStatus.ON_HOLD ? 'bg-yellow-500/10 text-yellow-500' : ''}
                ${status === DealStatus.CANCELLED ? 'bg-red-500/10 text-red-500' : ''}
              `}
            >
              {status === DealStatus.ACTIVE && <Clock className="w-4 h-4" />}
              {status === DealStatus.COMPLETED && <CheckCircle2 className="w-4 h-4" />}
              {status === DealStatus.ON_HOLD && <AlertCircle className="w-4 h-4" />}
              {status === DealStatus.CANCELLED && <XCircle className="w-4 h-4" />}
              {status}
            </Badge>
          </div>
          {renderProgressIndicator(progress, 'Overall Progress')}
        </div>

        {showHistory ? (
          <StageHistory
            dealType={dealType}
            timeline={deal.timeline}
            onRollback={handleRollback}
            className="mb-6"
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="mb-6"
          >
            View Stage History
          </Button>
        )}

        {/* Stage Progress */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage);
            const StageIcon = STAGE_INFO[stage].icon;
            const isExpanded = expandedStage === stage;

            return (
              <motion.div
                key={stage}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
    relative p-4 rounded-lg border
    ${stageStatus === 'current' ? 'bg-primary/5 border-primary' : 'bg-card'}
    ${stageStatus === 'blocked' ? 'border-destructive/50' : ''}
    ${stageStatus !== 'pending' ? 'cursor-pointer' : ''}
  `}
                onClick={() => {
                  // Toggle expansion only if stage is not pending
                  if (stageStatus !== 'pending') {
                    setExpandedStage(expandedStage === stage ? null : stage);
                    // Only trigger stage click for next stage if it's available
                    if (stageStatus === 'next' && handleStageClick) {
                      handleStageClick(stage);
                    }
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${STAGE_INFO[stage].color}`}>
                    <StageIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{STAGE_INFO[stage].label}</h4>
                      <div className="flex items-center gap-2">
                        {stageStatus === 'current' && (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </Badge>
                        )}
                        {stageStatus === 'blocked' && (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Blocked
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {Math.round(stageProgress[stage] || 0)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => setExpandedStage(isExpanded ? null : stage)}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                              }`}
                          />
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {(stage === expandedStage) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2"
                        >
                          <p className="text-sm text-muted-foreground">
                            {STAGE_INFO[stage].description}
                          </p>

                          <StageRequirementsChecklist
                            stage={stage}
                            dealType={dealType}
                            requirements={DEAL_STAGE_REQUIREMENTS[dealType][stage] || []}
                            completedRequirements={Array.isArray(dealConfig.processingSteps[index]) ?
                              DEAL_STAGE_REQUIREMENTS[dealType][stage].filter((req) => {
                                const completionThreshold = ((index + 1) / stages.length) * 100;
                                return (stageProgress[stage] || 0) >= completionThreshold;
                              }) :
                              []
                            }
                          />

                          {/* Stage Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            {stageStatus === 'completed' && index > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRollback(stages[index - 1]);
                                }}
                                className="gap-2"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Rollback
                              </Button>
                            )}

                            {(stageStatus === 'current' || stageStatus === 'next') && (
                              <Button
                                variant={stageStatus === 'current' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const validation = validateStageTransition(currentStage, stage);
                                  setTransitionConfirmation({
                                    show: true,
                                    targetStage: stage,
                                    requirements: validation.requirements,
                                    warnings: validation.warnings,
                                    validationErrors: validation.validationErrors
                                  });
                                }}
                                className="gap-2"
                              >
                                {stageStatus === 'current' ? 'Continue' : 'View'}
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {stageStatus === 'current' && renderProgressIndicator(stageProgress[stage] || 0)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Transition Confirmation Dialog */}
      <AlertDialog
        open={transitionConfirmation.show}
        onOpenChange={(open) => setTransitionConfirmation(prev => ({ ...prev, show: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stage Transition</AlertDialogTitle>
            <AlertDialogDescription>
              {transitionConfirmation.validationErrors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-destructive mb-2">Blocking Issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {transitionConfirmation.validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-destructive">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-2">
                <p className="font-medium mb-2">Required before proceeding:</p>
                <ul className="list-disc list-inside space-y-1">
                  {transitionConfirmation.requirements.map((req, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Badge variant="outline" className="capitalize">
                        {req.type}
                      </Badge>
                      {req.description}
                    </li>
                  ))}
                </ul>
              </div>

              {transitionConfirmation.warnings.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-yellow-600 mb-2">Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {transitionConfirmation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {transitionConfirmation.show && (
                <StageTransitionForm
                  currentStage={currentStage}
                  targetStage={transitionConfirmation.targetStage!}
                  dealType={dealType}
                  dealId={deal.id}
                  requirements={transitionConfirmation.requirements}
                  validationErrors={transitionConfirmation.validationErrors}
                  warnings={transitionConfirmation.warnings}
                  onConfirm={(reason) => {
                    onStageClick?.(transitionConfirmation.targetStage!);
                    setTransitionConfirmation({
                      show: false,
                      targetStage: null,
                      requirements: [],
                      warnings: [],
                      validationErrors: []
                    });
                  }}
                  onCancel={() => setTransitionConfirmation(prev => ({ ...prev, show: false }))}
                />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onStageClick?.(transitionConfirmation.targetStage!);
                setTransitionConfirmation(prev => ({ ...prev, show: false }));
              }}
              disabled={transitionConfirmation.validationErrors.length > 0}
            >
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stage Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to roll back to the previous stage? This action may require
              re-completing certain requirements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rollbackStage) {
                  onStageClick?.(rollbackStage);
                  setShowRollbackDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}