import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUBSCRIPTION_STATUS } from '@ged/database';
import type { SubscriptionStatus } from '@ged/database';

export class UpsertSubscriptionDto {
  @IsOptional()
  @IsEnum(SUBSCRIPTION_STATUS)
  readonly status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  readonly planName?: string | null;

  @IsNumberString({ no_symbols: false }, { message: 'valor must be a numeric string' })
  readonly valor!: string;

  @IsDateString()
  readonly startDate!: string;

  @IsOptional()
  @IsDateString()
  readonly endDate?: string | null;

  @IsOptional()
  @IsDateString()
  readonly nextBillingDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly notes?: string | null;
}
