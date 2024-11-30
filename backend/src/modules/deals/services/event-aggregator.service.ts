
import { Injectable } from '@nestjs/common';
import { DealEvent, DealEventType } from '../interfaces/deal-events.interface';

@Injectable()
export class EventAggregatorService {
  private eventBuffer: Map<string, DealEvent[]> = new Map();
  private readonly BUFFER_TIMEOUT = 5000;

  async aggregateEvent(event: DealEvent): Promise<DealEvent[]> {
    if (!this.eventBuffer.has(event.dealId)) {
      this.eventBuffer.set(event.dealId, []);
      this.scheduleFlush(event.dealId);
    }
    
    this.eventBuffer.get(event.dealId)?.push(event);
    return this.aggregateBufferedEvents(event.dealId);
  }

  private scheduleFlush(dealId: string): void {
    setTimeout(() => {
      this.flushEvents(dealId);
    }, this.BUFFER_TIMEOUT);
  }

  private aggregateBufferedEvents(dealId: string): DealEvent[] {
    const events = this.eventBuffer.get(dealId) || [];
    return this.mergeEvents(events);
  }

  private mergeEvents(events: DealEvent[]): DealEvent[] {
    const grouped = events.reduce((acc, event) => {
      const key = `${event.type}_${event.actor.id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {} as Record<string, DealEvent[]>);

    return Object.values(grouped).map(group => 
      group.length === 1 ? group[0] : this.createAggregatedEvent(group)
    );
  }

  private createAggregatedEvent(events: DealEvent[]): DealEvent {
    const base = events[0];
    return {
      ...base,
      data: {
        ...base.data,
        aggregated: true,
        count: events.length,
        events: events.map(e => ({
          id: e.id,
          dealId: e.dealId,
          actor: e.actor,
          recipients: e.recipients,
          type: e.type,
          timestamp: e.timestamp,
          data: e.data
        }))
      }
    };
  }

  private async flushEvents(dealId: string): Promise<void> {
    this.eventBuffer.delete(dealId);
  }
}