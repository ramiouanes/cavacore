import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventReminder } from './entities/event-reminder.entity';
import { EventbriteProvider } from './providers/eventbrite.provider';
import { EventFilterDto, EventReminderDto } from './dto/event.dto';
import { createEvents, EventAttributes } from 'ics';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventReminder)
    private readonly reminderRepository: Repository<EventReminder>,
    private readonly eventbriteProvider: EventbriteProvider
  ) {}


  async findEvents(filter: EventFilterDto) {
    return this.eventbriteProvider.fetchEvents(filter);
  }

  async findEventById(eventId: string) {
    return this.eventbriteProvider.fetchEventById(eventId);
  }

  async setReminder(userId: string, eventId: string, reminderDto: EventReminderDto) {
    const event = await this.findEventById(eventId);
    
    const reminder = this.reminderRepository.create({
      userId,
      eventSourceId: event.sourceId,
      eventSource: event.source,
      reminderDate: reminderDto.reminderDate,
      note: reminderDto.note,
      eventDetails: {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location
      }
    });

    return this.reminderRepository.save(reminder);
  }

  async generateCalendar(events: ExternalEvent[]): Promise<string> {
    const icsEvents: EventAttributes[] = events.map(event => ({
      start: this.dateToArray(event.startDate),
      end: this.dateToArray(event.endDate),
      title: event.title,
      description: event.description,
      location: event.location.address,
      url: event.url,
      organizer: { name: event.organizerName, email: event.organizerEmail }
    }));

    const { error, value } = createEvents(icsEvents);
    
    if (error) {
      throw new Error('Failed to generate calendar');
    }

    return value;
  }

  private dateToArray(date: Date): [number, number, number, number, number] {
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    ];
  }
}
