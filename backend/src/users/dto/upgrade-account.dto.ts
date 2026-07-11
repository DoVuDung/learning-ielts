import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class UpgradeAccountDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  amount?: number;
}
