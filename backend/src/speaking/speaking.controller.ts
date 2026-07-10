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
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SpeakingService, type ChatMessage } from './speaking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('speaking')
@ApiCookieAuth('access_token')
@Controller('speaking')
@UseGuards(JwtAuthGuard)
export class SpeakingController {
  constructor(private readonly speakingService: SpeakingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stream an AI speaking practice reply (Anthropic Claude)',
    description:
      'Returns a plain-text streaming response (`Transfer-Encoding: chunked`). ' +
      'Read the body as a ReadableStream on the client side.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['messages', 'topic'],
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' },
            },
          },
          example: [{ role: 'user', content: "Let's talk about IELTS preparation." }],
        },
        topic: { type: 'string', example: 'IELTS exam preparation' },
        apiKey: {
          type: 'string',
          description: 'Optional user-supplied Anthropic API key (overrides server key)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Chunked plain-text stream from Claude' })
  @ApiResponse({ status: 502, description: 'Anthropic API error' })
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
