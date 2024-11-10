import { IsString, IsOptional, IsDate, IsNumber, IsLatitude, IsLongitude, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum EventCategory {
  COMPETITION = 'competition',
  CLINIC = 'clinic',
  SHOW = 'show',
  AUCTION = 'auction',
  TRAINING = 'training',
  OTHER = 'other'
}

export class EventFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  radius?: number = 50; // Default 50km radius

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}

export class EventReminderDto {
  @IsDate()
  @Type(() => Date)
  reminderDate: Date;

  @IsOptional()
  @IsString()
  note?: string;
}
