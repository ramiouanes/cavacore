import { DealStage, DealStatus, ParticipantRole } from '../types/deal.types';
import { dealTypeUtils } from './deal-type-utils';

interface NotificationConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actions?: {
    label: string;
    action: string;
  }[];
  recipients?: ParticipantRole[];
}

interface DealChangeContext {
  dealType: string;
  previousStage?: DealStage;
  newStage?: DealStage;
  previousStatus?: DealStatus;
  newStatus?: DealStatus;
  actor?: {
    id: string;
    role: ParticipantRole;
  };
  progress?: number;
  pendingActions?: string[];
}

export const notificationUtils = {
  /**
   * Generates notification config for stage changes
   */
  getStageChangeNotification(context: DealChangeContext): NotificationConfig {
    const { previousStage, newStage, actor, pendingActions = [] } = context;
    const dealConfig = dealTypeUtils.getConfig(context.dealType as any);

    if (!previousStage || !newStage) {
      throw new Error('Stage information is required');
    }

    const stageIndex = dealConfig.stages.indexOf(newStage);
    const nextSteps = dealConfig.processingSteps.slice(stageIndex, stageIndex + 2);

    const notifications: Record<DealStage, NotificationConfig> = {
      [DealStage.INITIATION]: {
        title: 'Deal Initiated',
        message: 'A new deal has been created and requires your attention',
        type: 'info',
        actions: [
          { label: 'Review Details', action: 'REVIEW_DEAL' },
          { label: 'Add Information', action: 'EDIT_DEAL' }
        ],
        recipients: [ParticipantRole.SELLER, ParticipantRole.BUYER]
      },
      [DealStage.DISCUSSION]: {
        title: 'Deal Ready for Discussion',
        message: 'Deal terms are ready for review and discussion',
        type: 'info',
        actions: [
          { label: 'Review Terms', action: 'REVIEW_TERMS' },
          { label: 'Propose Changes', action: 'EDIT_TERMS' }
        ],
        recipients: [ParticipantRole.SELLER, ParticipantRole.BUYER, ParticipantRole.AGENT]
      },
      [DealStage.EVALUATION]: {
        title: 'Evaluation Phase Started',
        message: 'Deal is ready for inspection and evaluation',
        type: 'info',
        actions: [
          { label: 'Schedule Inspection', action: 'SCHEDULE_INSPECTION' },
          { label: 'View Requirements', action: 'VIEW_REQUIREMENTS' }
        ],
        recipients: [
          ParticipantRole.SELLER,
          ParticipantRole.BUYER,
          ParticipantRole.VETERINARIAN,
          ParticipantRole.INSPECTOR
        ]
      },
      [DealStage.DOCUMENTATION]: {
        title: 'Documentation Phase',
        message: 'Deal documents are ready for review and signing',
        type: 'info',
        actions: [
          { label: 'Review Documents', action: 'REVIEW_DOCUMENTS' },
          { label: 'Upload Documents', action: 'UPLOAD_DOCUMENTS' }
        ],
        recipients: [ParticipantRole.SELLER, ParticipantRole.BUYER]
      },
      [DealStage.CLOSING]: {
        title: 'Deal Closing',
        message: 'Deal is ready for final review and completion',
        type: 'warning',
        actions: [
          { label: 'Review Final Terms', action: 'REVIEW_FINAL' },
          { label: 'Complete Deal', action: 'COMPLETE_DEAL' }
        ],
        recipients: [ParticipantRole.SELLER, ParticipantRole.BUYER]
      },
      [DealStage.COMPLETE]: {
        title: 'Deal Completed',
        message: 'Deal has been successfully completed',
        type: 'success',
        actions: [
          { label: 'View Summary', action: 'VIEW_SUMMARY' },
          { label: 'Download Documents', action: 'DOWNLOAD_DOCUMENTS' }
        ]
      }
    };

    const notification = notifications[newStage];
    
    // Add pending actions if any
    if (pendingActions.length > 0) {
      notification.message += `\nPending actions: ${pendingActions.join(', ')}`;
    }

    // Add next steps if available
    if (nextSteps.length > 0) {
      notification.message += `\nNext steps: ${nextSteps.join(', ')}`;
    }

    return notification;
  },

  /**
   * Generates notification config for status changes
   */
  getStatusChangeNotification(context: DealChangeContext): NotificationConfig {
    const { previousStatus, newStatus, actor } = context;

    if (!previousStatus || !newStatus) {
      throw new Error('Status information is required');
    }

    const notifications: Record<DealStatus, NotificationConfig> = {
      [DealStatus.ACTIVE]: {
        title: 'Deal Activated',
        message: 'Deal is now active and ready to proceed',
        type: 'success',
        actions: [
          { label: 'View Deal', action: 'VIEW_DEAL' },
          { label: 'Take Action', action: 'VIEW_NEXT_STEPS' }
        ]
      },
      [DealStatus.ON_HOLD]: {
        title: 'Deal On Hold',
        message: 'Deal has been placed on hold',
        type: 'warning',
        actions: [
          { label: 'View Reason', action: 'VIEW_HOLD_REASON' },
          { label: 'Resume Deal', action: 'RESUME_DEAL' }
        ]
      },
      [DealStatus.CANCELLED]: {
        title: 'Deal Cancelled',
        message: 'Deal has been cancelled',
        type: 'error',
        actions: [
          { label: 'View Reason', action: 'VIEW_CANCELLATION' },
          { label: 'Contact Support', action: 'CONTACT_SUPPORT' }
        ]
      },
      [DealStatus.COMPLETED]: {
        title: 'Deal Completed',
        message: 'Deal has been successfully completed',
        type: 'success',
        actions: [
          { label: 'View Summary', action: 'VIEW_SUMMARY' },
          { label: 'Download Documents', action: 'DOWNLOAD_DOCUMENTS' }
        ]
      },
      [DealStatus.PENDING]: {
        title: 'Deal Pending',
        message: 'Deal is pending approval or action',
        type: 'info',
        actions: [
          { label: 'View Requirements', action: 'VIEW_REQUIREMENTS' },
          { label: 'Take Action', action: 'VIEW_ACTIONS' }
        ]
      }
    };

    const notification = notifications[newStatus];
    
    // Add actor information if available
    if (actor) {
      notification.message += `\nUpdated by: ${actor.role}`;
    }

    return notification;
  },

  /**
   * Determines which participants should be notified of changes
   */
  getNotificationRecipients(
    change: 'stage' | 'status',
    context: DealChangeContext
  ): ParticipantRole[] {
    const dealConfig = dealTypeUtils.getConfig(context.dealType as any);
    
    if (change === 'stage') {
      const stageNotification = this.getStageChangeNotification(context);
      return stageNotification.recipients || dealConfig.requiredRoles;
    } else {
      // For status changes, notify all participants
      return [...dealConfig.requiredRoles, ...dealConfig.recommendedRoles];
    }
  },

  /**
   * Generates progress notification based on completion percentage
   */
  getProgressNotification(context: DealChangeContext): NotificationConfig | null {
    const { progress = 0, pendingActions = [] } = context;
    
    if (progress === 100) {
      return {
        title: 'Deal Ready for Completion',
        message: 'All required steps have been completed',
        type: 'success',
        actions: [
          { label: 'Review & Complete', action: 'COMPLETE_DEAL' }
        ]
      };
    }

    if (progress >= 75) {
      return {
        title: 'Deal Nearly Complete',
        message: `Deal is ${progress}% complete. ${pendingActions.length} actions remaining.`,
        type: 'info',
        actions: [
          { label: 'View Remaining Steps', action: 'VIEW_PENDING' }
        ]
      };
    }

    if (pendingActions.length > 0) {
      return {
        title: 'Action Required',
        message: `${pendingActions.length} actions pending completion`,
        type: 'warning',
        actions: [
          { label: 'View Actions', action: 'VIEW_ACTIONS' }
        ]
      };
    }

    return null;
  }
};