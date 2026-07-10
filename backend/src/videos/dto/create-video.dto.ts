import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'YouTube video URL' })
  url: string;

  @ApiPropertyOptional({ example: 'IELTS', description: 'Video category', default: 'general' })
  category?: string;

  @ApiPropertyOptional({ example: 'B2', description: 'CEFR level (A1–C2)', default: 'B2' })
  level?: string;
}
