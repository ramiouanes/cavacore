import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DealEventType } from '../../types/deal-events.interface';
import { io, Socket } from 'socket.io-client';

export const useDealNotifications = (dealId?: string) => {
  const { toast } = useToast();
  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!dealId) return;

    const socket: Socket = io(`${SOCKET_URL}/deals`);

    const handleEvent = (event: any) => {
      switch (event.type) {
        case DealEventType.STAGE_CHANGED:
          toast({
            title: 'Stage Updated',
            description: `Deal moved to ${event.data.newStage} stage`
          });
          break;
        case DealEventType.STATUS_CHANGED:
          toast({
            title: 'Status Changed',
            description: `Deal status changed to ${event.data.newStatus}`
          });
          break;
        case DealEventType.DOCUMENT_ADDED:
          toast({
            title: 'New Document',
            description: `Document "${event.data.documentName}" was added`
          });
          break;
        case DealEventType.DOCUMENT_APPROVED:
          toast({
            title: 'Document Approved',
            description: `Document "${event.data.documentName}" was approved`
          });
          break;
        case DealEventType.DOCUMENT_REJECTED:
          toast({
            title: 'Document Rejected',
            description: `Document "${event.data.documentName}" was rejected`
          });
          break;
        case DealEventType.PARTICIPANT_ADDED:
          toast({
            title: 'New Participant',
            description: `${event.data.participant.role} was added to the deal`
          });
          break;
        case DealEventType.PARTICIPANT_REMOVED:
          toast({
            title: 'Participant Removed',
            description: `${event.data.participant.role} was removed from the deal`
          });
          break;
        case DealEventType.PARTICIPANT_UPDATED:
          toast({
            title: 'Participant Updated',
            description: `${event.data.participant.role} information was updated`
          });
          break;
        case DealEventType.TERMS_UPDATED:
          toast({
            title: 'Terms Updated',
            description: 'Deal terms have been modified'
          });
          break;
        case DealEventType.COMMENT_ADDED:
          toast({
            title: 'New Comment',
            description: 'A new comment was added to the deal'
          });
          break;
      }
    };

    socket.on('dealEvent', handleEvent);
    return () => {
      socket.off('dealEvent', handleEvent);
      socket.disconnect();
    };
  }, [dealId, toast]);
};