import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/dto/auth.dto';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@ApiTags('progress')
@ApiCookieAuth('access_token')
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Get dictation progress — all videos or filtered by videoId' })
  @ApiQuery({ name: 'videoId', required: false, description: 'Filter by specific video ID' })
  @ApiResponse({ status: 200, description: 'Progress record(s)' })
  find(@Req() req: AuthRequest, @Query('videoId') videoId?: string) {
    if (videoId) {
      return this.progressService.findByVideo(req.user.sub, videoId);
    }
    return this.progressService.findAll(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update dictation progress for a video' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['videoId', 'sentencesDone', 'totalSentences'],
      properties: {
        videoId: { type: 'string', example: 'clxyz123' },
        sentencesDone: { type: 'number', example: 5 },
        totalSentences: { type: 'number', example: 20 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Upserted progress record' })
  upsert(
    @Req() req: AuthRequest,
    @Body() body: { videoId: string; sentencesDone: number; totalSentences: number },
  ) {
    return this.progressService.upsert(req.user.sub, body);
  }
}
