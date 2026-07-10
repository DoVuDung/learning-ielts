import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUrl, IsOptional, IsIn, IsString } from 'class-validator';

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const VALID_CATEGORIES = ['general', 'TED', 'BBC', 'IELTS', 'News', 'Science', 'Business'] as const;

export class CreateVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'YouTube video URL' })
  @IsUrl({}, { message: 'url must be a valid YouTube URL' })
  url: string;

  @ApiPropertyOptional({ example: 'IELTS', enum: VALID_CATEGORIES, default: 'general' })
  @IsOptional()
  @IsIn(VALID_CATEGORIES, { message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` })
  category?: string;

  @ApiPropertyOptional({ example: 'B2', enum: VALID_LEVELS, default: 'B2', description: 'CEFR level' })
  @IsOptional()
  @IsIn(VALID_LEVELS, { message: `level must be one of: ${VALID_LEVELS.join(', ')}` })
  level?: string;
}

export class SaveWordDto {
  @ApiProperty({ example: 'ubiquitous', description: 'Word to save (max 100 chars)' })
  @IsString()
  word: string;

  @ApiPropertyOptional({ example: 'Smartphones are ubiquitous in modern life.' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ example: 'Present, appearing, or found everywhere' })
  @IsOptional()
  @IsString()
  definition?: string;

  @ApiPropertyOptional({ example: 'clxyz123', description: 'Source video ID' })
  @IsOptional()
  @IsString()
  videoId?: string;
}

export class DeleteWordDto {
  @ApiProperty({ example: 'ubiquitous' })
  @IsString()
  word: string;
}

export class ReviewCardDto {
  @ApiProperty({ example: 'clxyz456', description: 'Card ID (cuid)' })
  @IsString()
  cardId: string;

  @ApiProperty({ enum: [1, 2, 3, 4], description: '1=Again  2=Hard  3=Good  4=Easy' })
  @IsIn([1, 2, 3, 4], { message: 'rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)' })
  rating: 1 | 2 | 3 | 4;
}

export class UpsertProgressDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  videoId: string;

  @ApiProperty({ example: 5 })
  sentencesDone: number;

  @ApiProperty({ example: 20 })
  totalSentences: number;
}

export class SpeakingChatDto {
  @ApiProperty({
    type: 'array',
    example: [{ role: 'user', content: "Let's talk about IELTS." }],
  })
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;

  @ApiProperty({ example: 'IELTS exam preparation' })
  @IsString()
  topic: string;

  @ApiPropertyOptional({ description: 'Optional user-supplied Anthropic API key' })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
