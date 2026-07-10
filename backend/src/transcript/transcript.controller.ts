import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TranscriptService } from './transcript.service';

@ApiTags('transcript')
@Controller('transcript')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch YouTube subtitles for a given video and language' })
  @ApiQuery({ name: 'videoId', required: true, description: 'YouTube video ID (e.g. dQw4w9WgXcQ)' })
  @ApiQuery({ name: 'lang', required: false, description: 'BCP-47 language code', example: 'en', schema: { default: 'en' } })
  @ApiResponse({ status: 200, description: 'Array of transcript lines with text, offset, duration, lang' })
  @ApiResponse({ status: 400, description: 'videoId is required' })
  @ApiResponse({ status: 404, description: 'Subtitles not available in the requested language' })
  @ApiResponse({ status: 502, description: 'Failed to fetch transcript from YouTube' })
  async fetch(
    @Query('videoId') videoId: string,
    @Query('lang') lang: string = 'en',
  ) {
    if (!videoId) {
      throw new HttpException('videoId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.transcriptService.fetch(videoId, lang);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transcript';
      const status = msg.toLowerCase().includes('language') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_GATEWAY;
      throw new HttpException(msg, status);
    }
  }
}
