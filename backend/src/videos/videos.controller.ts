import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CreateVideoDto } from './dto/create-video.dto';
import type { JwtPayload } from '../auth/dto/auth.dto';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.videosService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  importVideo(@Body() dto: CreateVideoDto, @Req() req: AuthRequest) {
    return this.videosService.importVideo(dto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.videosService.remove(id, req.user.sub);
  }
}
