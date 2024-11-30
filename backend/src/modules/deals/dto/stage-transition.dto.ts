import { IsEnum, IsString, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DealStage, DealStatus } from '../entities/deal.entity';

export class StageRequirementDto {
  @IsString()
  type!: string;

  @IsString()
  status!: 'completed' | 'pending' | 'failed';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StageTransitionDto {
  @IsUUID()
  dealId!: string;

  @IsEnum(DealStage)
  targetStage!: DealStage;

  @IsOptional()
  @IsEnum(DealStatus)
  newStatus?: DealStatus;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StageRequirementDto)
  requirements?: StageRequirementDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StageValidationResultDto {
  canProgress!: boolean;
  missingRequirements!: string[];
  validationErrors!: string[];
  recommendations!: string[];
}

export class StageProgressDto {
  @IsEnum(DealStage)
  fromStage!: DealStage;

  @IsEnum(DealStage)
  toStage!: DealStage;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StageRequirementDto)
  completedRequirements?: StageRequirementDto[];
}