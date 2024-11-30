import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IEventProvider, ExternalEvent } from '../interfaces/event-provider.interface';
import { EventFilterDto, EventCategory } from '../dto/event.dto';

@Injectable()
export class EventbriteProvider implements IEventProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.eventbriteapi.com/v3';
  private readonly equineCategories = ['7002', '7003']; // Eventbrite category IDs for equestrian events

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.apiKey = this.configService.get<string>('EVENTBRITE_API_KEY');
  }

  async fetchEvents(filter: EventFilterDto): Promise<ExternalEvent[]> {
    const params = this.buildEventbriteParams(filter);
    
    try {
      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}/events/search`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          params
        }
      );

      return this.transformEvents(data.events);
    } catch (error) {
      console.error('Eventbrite API error:', error.response?.data || error.message);
      return [];
    }
  }

  async fetchEventById(eventId: string): Promise<ExternalEvent> {
    try {
      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}/events/${eventId}`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }
      );

      return this.transformEvent(data);
    } catch (error) {
      console.error('Eventbrite API error:', error.response?.data || error.message);
      throw new Error('Event not found');
    }
  }

  private buildEventbriteParams(filter: EventFilterDto): any {
    return {
      categories: this.equineCategories.join(','),
      'start_date.range_start': filter.startDate?.toISOString(),
      'start_date.range_end': filter.endDate?.toISOString(),
      'location.latitude': filter.latitude,
      'location.longitude': filter.longitude,
      'location.within': filter.radius ? `${filter.radius}km` : undefined,
      q: filter.search,
      page: filter.page,
      page_size: filter.limit
    };
  }

  private transformEvent(event: any): ExternalEvent {
    return {
      sourceId: event.id,
      source: 'eventbrite',
      title: event.name.text,
      description: event.description.text,
      startDate: new Date(event.start.utc),
      endDate: new Date(event.end.utc),
      location: {
        address: event.venue?.address?.localized_address_display || '',
        latitude: parseFloat(event.venue?.latitude) || 0,
        longitude: parseFloat(event.venue?.longitude) || 0
      },
      category: this.mapEventbriteCategory(event.category_id),
      url: event.url,
      organizerName: event.organizer?.name || '',
      organizerEmail: event.organizer?.email,
      imageUrl: event.logo?.url,
      price: event.ticket_availability?.minimum_ticket_price ? {
        amount: parseFloat(event.ticket_availability.minimum_ticket_price.value),
        currency: event.ticket_availability.minimum_ticket_price.currency
      } : undefined
    };
  }

  private transformEvents(events: any[]): ExternalEvent[] {
    return events.map(event => this.transformEvent(event));
  }

  private mapEventbriteCategory(categoryId: string): EventCategory {
    const categoryMap: Record<string, EventCategory> = {
      '7002': EventCategory.COMPETITION,
      '7003': EventCategory.SHOW,
      // Add more mappings as needed
    };
    return categoryMap[categoryId] || EventCategory.OTHER;
  }
}
