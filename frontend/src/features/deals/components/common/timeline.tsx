import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ArrowRight,
  ChevronRight, 
  ChevronDown
} from 'lucide-react';
import { TimelineEntry, TimelineEventType } from '../../types/timeline.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineProps {
  entries: TimelineEntry[];
  onEntryClick?: (entry: TimelineEntry) => void;
  className?: string;
  showMetadata?: boolean;
  renderCustomEntry?: (entry: TimelineEntry) => JSX.Element;
}


export function Timeline({ entries, onEntryClick, className, showMetadata = false }: TimelineProps) {

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (expandedEntries.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case TimelineEventType.STAGE_CHANGE:
        return ArrowRight;
      case TimelineEventType.STATUS_CHANGE:
        return Clock;
      case TimelineEventType.PARTICIPANT_CHANGE:
        return Users;
      case TimelineEventType.DOCUMENT_CHANGE:
        return FileText;
      case TimelineEventType.COMMENT:
        return MessageSquare;
      case TimelineEventType.SYSTEM:
        return Settings;
      default:
        return AlertCircle;
    }
  };


  const getEventColor = (type: TimelineEventType, success = true) => {
    if (!success) return 'text-destructive';
    
    switch (type) {
      case TimelineEventType.STAGE_CHANGE:
        return 'text-blue-500';
      case TimelineEventType.STATUS_CHANGE:
        return 'text-yellow-500';
      case TimelineEventType.PARTICIPANT_CHANGE:
        return 'text-green-500';
      case TimelineEventType.DOCUMENT_CHANGE:
        return 'text-purple-500';
      case TimelineEventType.COMMENT:
        return 'text-indigo-500';
      default:
        return 'text-gray-500';
    }
  };


  if (!entries.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No timeline entries yet
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-4", className)}>
      <div className="absolute top-0 left-6 bottom-0 w-px bg-border" />

      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => {
          const Icon = getEventIcon(entry.type);
          const isExpanded = expandedEntries.has(entry.id);
          const isFailure = entry.metadata?.success === false;
          const isRollback = entry.metadata?.isRollback;

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative flex gap-4 pl-12"
              onClick={() => onEntryClick?.(entry)}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={cn(
                      "absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full",
                      "flex items-center justify-center",
                      "bg-background border-2",
                      getEventColor(entry.type, !isFailure),
                      isRollback && "animate-pulse"
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFailure ? 'Failed Action' : entry.type.replace('_', ' ')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className={cn(
                "flex-1 bg-muted/50 rounded-lg p-4",
                isFailure && "border-destructive/50 border"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="font-medium">{entry.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>By {entry.actor}</span>
                      {entry.metadata?.automatic && (
                        <Badge variant="outline" className="text-xs">
                          Automatic
                        </Badge>
                      )}
                    </div>
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleString()}
                  </time>
                </div>

                {showMetadata && entry.metadata && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEntry(entry.id);
                    }}
                    className="mt-2 w-full justify-between"
                  >
                    Details
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 pt-2 border-t text-sm space-y-1"
                    >
                      {entry.metadata && Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span>{value?.toString()}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}