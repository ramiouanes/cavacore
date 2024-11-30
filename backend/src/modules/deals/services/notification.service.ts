import { Injectable } from '@nestjs/common';
import { DealEventsGateway } from '../gateways/deal-events.gateway';
import { Deal, DealStatus, DealStage } from '../entities/deal.entity';
import { TimelineEntry } from '../interfaces/timeline.interface';
import { DealEventType } from '../interfaces/deal-events.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  constructor(private readonly eventsGateway: DealEventsGateway) {}

  async notifyStageChange(
    deal: Deal,
    previousStage: DealStage,
    actorId: string
  ): Promise<void> {
    this.eventsGateway.emitDealEvent({
      id: uuidv4(),
      type: DealEventType.STAGE_CHANGED,
      dealId: deal.id,
      timestamp: new Date(),
      actor: { id: actorId },
      data: {
        previousStage,
        newStage: deal.stage,
        description: `Deal stage changed to ${deal.stage}`
      },
      recipients: this.getRelevantParticipants(deal, previousStage)
    });
  }

  async notifyStatusChange(
    deal: Deal,
    previousStatus: DealStatus,
    actorId: string,
    reason?: string
  ): Promise<void> {
    this.eventsGateway.emitDealEvent({
      id: uuidv4(),
      type: DealEventType.STATUS_CHANGED,
      dealId: deal.id,
      timestamp: new Date(),
      actor: { id: actorId },
      data: {
        previousStatus,
        newStatus: deal.status,
        reason,
        description: `Deal status changed to ${deal.status}`
      },
      recipients: deal.participants.map(p => p.userId)
    });
  }

  private getRelevantParticipants(deal: Deal, stage: DealStage): string[] {
    const baseParticipants = ['seller', 'buyer', 'agent'];
    const stageSpecific: { [key in DealStage]?: string[] } = {
      [DealStage.EVALUATION]: ['inspector', 'veterinarian'],
      [DealStage.DOCUMENTATION]: ['agent'],
      [DealStage.CLOSING]: ['seller', 'buyer', 'agent']
    };

    const roles = [...baseParticipants, ...(stageSpecific[stage] || [])];
    return deal.participants
      .filter(p => roles.includes(p.role.toLowerCase()))
      .map(p => p.userId);
  }

  async notifyTimeline(
    deal: Deal,
    entry: TimelineEntry
  ): Promise<void> {
    this.eventsGateway.emitDealEvent({
      id: uuidv4(),
      type: DealEventType.TIMELINE_UPDATED,
      dealId: deal.id,
      timestamp: new Date(),
      actor: { id: entry.actor },
      data: { entry },
      recipients: deal.participants.map(p => p.userId)
    });
  }
}
