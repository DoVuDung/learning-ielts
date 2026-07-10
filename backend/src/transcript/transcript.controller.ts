import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TranscriptService } from './transcript.service';

@Controller('transcript')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get()
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
