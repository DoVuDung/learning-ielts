import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/dto/auth.dto';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  find(@Req() req: AuthRequest, @Query('videoId') videoId?: string) {
    if (videoId) {
      return this.progressService.findByVideo(req.user.sub, videoId);
    }
    return this.progressService.findAll(req.user.sub);
  }

  @Post()
  upsert(
    @Req() req: AuthRequest,
    @Body() body: { videoId: string; sentencesDone: number; totalSentences: number },
  ) {
    return this.progressService.upsert(req.user.sub, body);
  }
}
