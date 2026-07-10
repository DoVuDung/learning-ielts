import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SpeakingService, type ChatMessage } from './speaking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('speaking')
@UseGuards(JwtAuthGuard)
export class SpeakingController {
  constructor(private readonly speakingService: SpeakingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: { messages: ChatMessage[]; topic: string; apiKey?: string },
    @Res() res: Response,
  ) {
    const readable = await this.speakingService.streamResponse(
      body.messages,
      body.topic,
      body.apiKey,
    );

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = readable.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  }
}
