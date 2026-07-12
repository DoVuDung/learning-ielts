import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
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
import type { Request } from 'express';
import { WordsService } from './words.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/dto/auth.dto';
import type { Rating } from './fsrs';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@ApiTags('words')
@ApiCookieAuth('access_token')
@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get()
  @ApiOperation({ summary: 'List all saved vocabulary notes with their FSRS cards' })
  @ApiResponse({ status: 200, description: 'Array of notes with cards' })
  findAll(@Req() req: AuthRequest) {
    return this.wordsService.findAll(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a new word / update an existing note' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['word'],
      properties: {
        word: { type: 'string', example: 'ubiquitous' },
        definition: { type: 'string', example: 'Present everywhere at the same time' },
        context: { type: 'string', example: 'Smartphones are ubiquitous in modern life.' },
        videoId: { type: 'string', example: 'clxyz123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Note created or updated' })
  save(
    @Req() req: AuthRequest,
    @Body() body: { word: string; context?: string; videoId?: string; definition?: string },
  ) {
    return this.wordsService.save(req.user.sub, body);
  }

  @Post('import-llm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import vocabulary notes from LLM text or structured JSON' })
  @ApiResponse({ status: 200, description: 'Imported notes count and data' })
  importLlmNotes(
    @Req() req: AuthRequest,
    @Body()
    body: {
      rawText?: string;
      notes?: Array<{
        word: string;
        definition?: string;
        context?: string;
        tags?: string[];
      }>;
    },
  ) {
    return this.wordsService.importLlmNotes(req.user.sub, body);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a saved word and all its cards' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['word'],
      properties: {
        word: { type: 'string', example: 'ubiquitous' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '{ ok: true }' })
  remove(@Req() req: AuthRequest, @Body() body: { word: string }) {
    return this.wordsService.remove(req.user.sub, body.word);
  }

  @Post('review')
  @ApiOperation({ summary: 'Submit a FSRS-5 card review rating' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cardId', 'rating'],
      properties: {
        cardId: { type: 'string', example: 'clxyz456' },
        rating: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '1=Again, 2=Hard, 3=Good, 4=Easy',
          example: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated card with next review schedule' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  review(@Req() req: AuthRequest, @Body() body: { cardId: string; rating: Rating }) {
    return this.wordsService.review(req.user.sub, body);
  }
}
