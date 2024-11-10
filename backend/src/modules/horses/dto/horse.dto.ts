import { IsString, IsOptional, IsUUID, IsNumber, IsArray, IsDate, IsEnum, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';


export enum HorseStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  ARCHIVED = 'archived',
  DRAFT = 'draft'
}

export class CreateHorseDto {
  @IsString()
  name: string;

  @IsString()
  breed: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  discipline?: string[];

  @IsOptional()
  @IsObject()
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export class UpdateHorseDto extends CreateHorseDto {
  @IsOptional()
  @IsEnum(HorseStatus)
  status?: HorseStatus;
}

export class HorseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  breeds?: string[];

  @IsOptional()
  @IsArray()
  disciplines?: string[];

  @IsOptional()
  @IsNumber()
  minHeight?: number;

  @IsOptional()
  @IsNumber()
  maxHeight?: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(HorseStatus)
  status?: HorseStatus;
  
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
