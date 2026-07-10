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
import type { Request } from 'express';
import { WordsService } from './words.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/dto/auth.dto';
import type { Rating } from './fsrs';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.wordsService.findAll(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  save(
    @Req() req: AuthRequest,
    @Body() body: { word: string; context?: string; videoId?: string; definition?: string },
  ) {
    return this.wordsService.save(req.user.sub, body);
  }

  @Delete()
  remove(@Req() req: AuthRequest, @Body() body: { word: string }) {
    return this.wordsService.remove(req.user.sub, body.word);
  }

  @Post('review')
  review(@Req() req: AuthRequest, @Body() body: { cardId: string; rating: Rating }) {
    return this.wordsService.review(req.user.sub, body);
  }
}
