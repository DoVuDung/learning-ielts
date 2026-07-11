import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateUserPremiumDto {
  @IsBoolean()
  isPremium!: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  extendDays?: number;
}

export class ManualApproveTransactionDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class AdminCreateVideoDto {
  @IsString()
  @IsNotEmpty()
  youtubeId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  level!: string;

  @IsString()
  @IsOptional()
  channelName?: string;
}
