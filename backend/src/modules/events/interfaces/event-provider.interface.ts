export interface IEventProvider {
  fetchEvents(filter: EventFilterDto): Promise<ExternalEvent[]>;
  fetchEventById(eventId: string): Promise<ExternalEvent>;
}

export interface ExternalEvent {
  sourceId: string;
  source: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  category: EventCategory;
  url: string;
  organizerName: string;
  organizerEmail?: string;
  imageUrl?: string;
  price?: {
    amount: number;
    currency: string;
  };
}
