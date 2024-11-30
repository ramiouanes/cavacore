import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DealStage, DealType, StageRequirement, DEAL_STAGE_REQUIREMENTS } from '../../types/deal.types';

interface StageRequirementsChecklistProps {
  stage: DealStage;
  dealType: DealType;
  requirements: StageRequirement[];
  completedRequirements: StageRequirement[];
  className?: string;
}

export function StageRequirementsChecklist({
  stage,
  dealType,
  completedRequirements,
  className
}: StageRequirementsChecklistProps) {
  const stageReqs = DEAL_STAGE_REQUIREMENTS[dealType][stage] || [];
  
  // Combine all requirements into a flat array
  const requirements = [
    ...stageReqs
  ];

  const progress = Math.round((completedRequirements.length / requirements.length) * 100);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Stage Requirements</h3>
          <Badge variant="outline">{progress}% Complete</Badge>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {requirements.map((requirement, index) => {
            const isCompleted = completedRequirements.some(
              r => r.type === requirement.type && r.description === requirement.description
            );
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 mt-1 text-primary" />
                ) : (
                  <Circle className="w-4 h-4 mt-1 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{requirement.description}</p>
                  {!isCompleted && requirement.type === 'document' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Required for stage completion
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}