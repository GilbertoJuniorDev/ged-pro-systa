import { IsDateString, IsOptional } from 'class-validator';

export class RecordPaymentDto {
  @IsDateString()
  readonly paidAt!: string;

  @IsOptional()
  @IsDateString()
  readonly nextBillingDate?: string | null;
}
