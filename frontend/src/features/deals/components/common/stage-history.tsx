// src/features/deals/components/common/stage-history.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Timeline } from './timeline';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DealType, DealStage, TimelineEntry } from '../../types/deal.types';
import { dealTypeUtils } from '../../utils/deal-type-utils';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface StageHistoryProps {
  dealType: DealType;
  timeline: TimelineEntry[];
  onRollback?: (stage: DealStage) => void;
  className?: string;
}

export function StageHistory({
  dealType,
  timeline,
  onRollback,
  className
}: StageHistoryProps) {
  const stageTransitions = timeline.filter(entry => 
    entry.type === 'STAGE_CHANGE' || entry.metadata?.isRollback
  );

  const getTransitionStats = () => {
    const stats = {
      totalTransitions: stageTransitions.length,
      rollbacks: stageTransitions.filter(t => t.metadata?.isRollback).length,
      averageTimeInStage: 0
    };

    if (stageTransitions.length > 1) {
      let totalTime = 0;
      for (let i = 1; i < stageTransitions.length; i++) {
        totalTime += new Date(stageTransitions[i].date).getTime() - 
                    new Date(stageTransitions[i-1].date).getTime();
      }
      stats.averageTimeInStage = totalTime / (stageTransitions.length - 1);
    }

    return stats;
  };

  const stats = getTransitionStats();

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Stage Transition History</h3>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {stats.totalTransitions} Transitions
            </Badge>
            {stats.rollbacks > 0 && (
              <Badge variant="destructive">
                {stats.rollbacks} Rollbacks
              </Badge>
            )}
          </div>
        </div>

        {stats.averageTimeInStage > 0 && (
          <div className="text-sm text-muted-foreground">
            Average time in stage: {Math.round(stats.averageTimeInStage / (1000 * 60 * 60 * 24))} days
          </div>
        )}

        <Timeline 
          entries={stageTransitions}
          showMetadata
          renderCustomEntry={(entry) => (
            <div className="flex items-center gap-2">
              {entry.metadata?.isRollback ? (
                <RotateCcw className="w-4 h-4 text-destructive" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>
                {entry.metadata?.previousStage} → {entry.metadata?.newStage}
              </span>
            </div>
          )}
        />
      </div>
    </Card>
  );
}