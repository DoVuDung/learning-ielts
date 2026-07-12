import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class UpdateUserPremiumDto {
  @IsBoolean()
  isPremium!: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  extendDays?: number;
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
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

export class AdminUpdateVideoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  level?: string;
}
