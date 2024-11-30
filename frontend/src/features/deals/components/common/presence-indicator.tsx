import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PresenceIndicatorProps {
  connectedUsers: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }>;
  maxDisplay?: number;
}

export function PresenceIndicator({ connectedUsers, maxDisplay = 3 }: PresenceIndicatorProps) {
  const displayed = connectedUsers.slice(0, maxDisplay);
  const remaining = connectedUsers.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map(user => (
        <TooltipProvider key={`tooltip-${user.id}-${uuidv4()}`}>
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{user.email}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remaining > 0 && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
          +{remaining}
        </div>
      )}
    </div>
  );
}