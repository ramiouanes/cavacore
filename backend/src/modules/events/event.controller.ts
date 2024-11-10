import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventFilterDto, EventReminderDto } from './dto/event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  async findEvents(@Query() filter: EventFilterDto) {
    return this.eventService.findEvents(filter);
  }

  @Get(':id')
  async findEvent(@Param('id') id: string) {
    return this.eventService.findEventById(id);
  }

  @Post(':id/remind')
  @UseGuards(JwtAuthGuard)
  async setReminder(
    @Request() req,
    @Param('id') eventId: string,
    @Body() reminderDto: EventReminderDto
  ) {
    return this.eventService.setReminder(req.user.id, eventId, reminderDto);
  }

  @Get('calendar')
  async getCalendar(@Query() filter: EventFilterDto) {
    const events = await this.eventService.findEvents(filter);
    const calendar = await this.eventService.generateCalendar(events);
    
    return {
      content: calendar,
      contentType: 'text/calendar',
      filename: 'hiplando-events.ics'
    };
  }
}