import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  MoreVertical,
  UserPlus,
  Shield,
  Clock,
  UserMinus
} from 'lucide-react';
import { ParticipantRole } from '../../types/deal.types';
import { useToast } from '@/hooks/use-toast';
import { AddParticipantPayload } from '../../types/participant.dto';
import { AddParticipantModal } from './add-participant';
import { useUserData } from '@/features/users/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';

interface DealParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  permissions: string[];
  // dateAdded: string;
  // status: 'active' | 'inactive';
  metadata?: {
    title?: string;
    company?: string;
    license?: string;
    notes?: string;
  };
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ParticipantsProps {
  participants: DealParticipant[];
  onAddParticipant?: (data: AddParticipantPayload) => void;
  onRemoveParticipant?: (id: string) => void;
  onUpdateParticipant?: (id: string, data: Partial<DealParticipant>) => void;
  className?: string;
  canManage?: boolean;

}

function ParticipantCard({ participant, canManage = false }: { participant: DealParticipant; canManage?: boolean }) {
  const { user, isLoading } = useUserData(participant.userId);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // console.log('user from participant', user);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            {isLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
              <>
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName} ${user?.lastName
                    }`}
                />
                <AvatarFallback>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </>
            )}
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className={`px-2 py-0.5 rounded-full text-xs text-white ${getRoleColor(participant.role)
                    }`}>
                    {participant.role.replace('_', ' ')}
                  </div>
                </>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-3 w-24 mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            )}
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  // Handle permissions
                }}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                Permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Handle change role
                }}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedParticipant(participant.id);
                  setShowRemoveDialog(true);
                }}
                className="gap-2 text-destructive"
              >
                <UserMinus className="w-4 h-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {participant.metadata?.title && (
        <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
          {participant.metadata.title}
          {participant.metadata.company && ` • ${participant.metadata.company}`}
        </div>
      )}
    </Card>
  );
}

const getRoleColor = (role: ParticipantRole) => {
  switch (role) {
    case ParticipantRole.SELLER:
      return 'bg-blue-500';
    case ParticipantRole.BUYER:
      return 'bg-green-500';
    case ParticipantRole.AGENT:
      return 'bg-purple-500';
    case ParticipantRole.VETERINARIAN:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export function Participants({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  className,
  canManage = false
}: ParticipantsProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemove = async () => {
    if (selectedParticipant && onRemoveParticipant) {
      try {
        setLoading(selectedParticipant);
        await onRemoveParticipant(selectedParticipant);
        setShowRemoveDialog(false);
        toast({
          title: 'Participant removed',
          description: 'The participant has been removed from the deal'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to remove participant',
          variant: 'destructive'
        });
      } finally {
        setLoading(null);
        setSelectedParticipant(null);
      }
    }
  };


  return (
    // console.log('participants', participants),
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Participants ({participants.length})</h3>
        {canManage && onAddParticipant && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {participants.map((participant) => (
            <motion.div
              key={participant.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ParticipantCard participant={participant} canManage={canManage} />

            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AddParticipantModal
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={onAddParticipant!}

      />

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}