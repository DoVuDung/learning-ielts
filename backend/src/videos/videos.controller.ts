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
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import type { JwtPayload } from '../auth/dto/auth.dto';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@ApiTags('videos')
@ApiCookieAuth('access_token')
@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiOperation({ summary: 'List all videos imported by the current user' })
  @ApiResponse({ status: 200, description: 'Array of videos' })
  findAll(@Req() req: AuthRequest) {
    return this.videosService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single video with all its sentences' })
  @ApiParam({ name: 'id', description: 'Video ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Video detail with sentences' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import a YouTube video (fetches transcript & metadata)' })
  @ApiResponse({ status: 201, description: 'Video created successfully' })
  @ApiResponse({ status: 409, description: 'Video already imported' })
  importVideo(@Body() dto: CreateVideoDto, @Req() req: AuthRequest) {
    return this.videosService.importVideo(dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video' })
  @ApiParam({ name: 'id', description: 'Video ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Video deleted' })
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.videosService.remove(id, req.user.sub);
  }
}
