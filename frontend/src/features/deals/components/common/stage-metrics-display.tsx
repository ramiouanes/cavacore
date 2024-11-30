import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChartLine,
  ClockIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { DealStage, Deal } from '../../types/deal.types';
import { TimelineEntry } from '../../types/timeline.types';

interface StageMetricsDisplayProps {
  deal: Deal;
  currentStage: DealStage;
  stageHistory: TimelineEntry[];
}

export function StageMetricsDisplay({
  deal,
  currentStage,
  stageHistory
}: StageMetricsDisplayProps) {
  const [metrics, setMetrics] = useState({
    averageTimeInStage: 0,
    completionRate: 0,
    blockers: [],
    projectedCompletion: null as Date | null
  });

  useEffect(() => {
    // Calculate metrics
    const stageEntries = stageHistory.filter(entry => 
      entry.metadata?.newStage === currentStage
    );

    // Average time in stage
    const stageDurations = stageEntries.map(entry => {
      const nextStageEntry = stageHistory.find(e => 
        e.metadata?.previousStage === entry.metadata?.newStage
      );
      if (!nextStageEntry) return Date.now() - new Date(entry.date).getTime();
      return new Date(nextStageEntry.date).getTime() - new Date(entry.date).getTime();
    });

    const averageTime = stageDurations.reduce((a, b) => a + b, 0) / stageDurations.length;

    // Completion rate
    const completedRequirements = deal.stageRequirements?.[currentStage]?.documents.filter(
      doc => doc.status === 'approved'
    ).length || 0;
    const totalRequirements = deal.stageRequirements?.[currentStage]?.documents.length || 1;
    const completionRate = (completedRequirements / totalRequirements) * 100;

    // Identify blockers
    const blockers = deal.stageRequirements?.[currentStage]?.documents
      .filter(doc => doc.status === 'rejected')
      .map(doc => doc.type) || [];

    // Project completion
    const projectedDate = new Date(Date.now() + (averageTime * (1 - completionRate/100)));

    setMetrics({
      averageTimeInStage: averageTime,
      completionRate,
      blockers,
      projectedCompletion: projectedDate
    });
  }, [deal, currentStage, stageHistory]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Stage Metrics</h3>
        <Badge variant="outline" className="gap-1">
          <ChartLine className="w-4 h-4" />
          Analytics
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average Time</span>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{Math.floor(metrics.averageTimeInStage / (1000 * 60 * 60))}h</span>
            </div>
          </div>
          <Progress value={metrics.completionRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{Math.round(metrics.completionRate)}%</span>
            </div>
          </div>
          <Progress value={metrics.completionRate} className="h-2" />
        </div>
      </div>

      {metrics.blockers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-2 border-t"
        >
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Blockers</span>
          </div>
          <ul className="space-y-1">
            {metrics.blockers.map((blocker, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <XCircle className="w-3 h-3" />
                {blocker}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {metrics.projectedCompletion && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Projected Completion</span>
            <span>{metrics.projectedCompletion.toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </Card>
  );
}