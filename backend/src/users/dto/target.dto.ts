import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTargetDto {
  @IsOptional()
  @IsNumber()
  @Min(4.5)
  @Max(9.0)
  targetIeltsBand?: number;

  @IsOptional()
  @IsString()
  targetCefrLevel?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(300)
  dailyMinutesTarget?: number;
}

export class AssessmentAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  selectedAnswer: string;
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  answers: AssessmentAnswerDto[];
}
