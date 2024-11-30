import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useDealSocket = (dealId?: string, onPresenceUpdate?: (users: any[]) => void) => {
    const token = localStorage.getItem('token');
  const { toast } = useToast();
  const { user } = useAuth();

  // console.log("user", user)
  
  useEffect(() => {
    if (!dealId || !user) return;

    const socket: Socket = io(`${SOCKET_URL}/deals`, {
        auth: {
          user: {
            id: user.id,
            email: user.email
          },
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      

    socket.on('connect', () => {
      socket.emit('subscribeToDeal', dealId);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('presence', (data: { dealId: string; connectedUsers: string[] }) => {
        // console.log('Connected users:', data.connectedUsers);
        onPresenceUpdate?.(data.connectedUsers);
      });
      

    socket.on('deal.STAGE_CHANGED', (event) => {
      toast({
        title: 'Deal Stage Updated',
        description: `Deal moved to ${event.data.newStage} stage`
      });
    });

    socket.on('deal.STATUS_CHANGED', (event) => {
      toast({
        title: 'Deal Status Updated',
        description: `Deal status changed to ${event.data.newStatus}`
      });
    });

    socket.on('deal.DOCUMENT_APPROVED', (event) => {
      toast({
        title: 'Document Approved',
        description: `Document "${event.data.documentName}" was approved`
      });
    });

    socket.on('deal.DOCUMENT_REJECTED', (event) => {
      toast({
        title: 'Document Rejected',
        description: `Document "${event.data.documentName}" was rejected`
      });
    });

    socket.on('deal.PARTICIPANT_ADDED', (event) => {
      toast({
        title: 'New Participant',
        description: `${event.data.participant.role} was added to the deal`
      });
    });

    return () => {
      socket.emit('unsubscribeFromDeal', dealId);
      socket.disconnect();
    };
  }, [dealId, user, token]);
};