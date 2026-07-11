import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpgradeAccountDto } from './dto/upgrade-account.dto';
import { UpdateTargetDto, SubmitAssessmentDto } from './dto/target.dto';
import type { AuthUser } from '../auth/dto/auth.dto';

interface RequestWithUser extends Request {
  user: AuthUser;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.id);
    return user;
  }

  @Get('me/target')
  @UseGuards(JwtAuthGuard)
  async getMyTarget(@Req() req: RequestWithUser) {
    return this.usersService.getTarget(req.user.id);
  }

  @Patch('me/target')
  @UseGuards(JwtAuthGuard)
  async updateMyTarget(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateTargetDto,
  ) {
    return this.usersService.updateTarget(req.user.id, dto);
  }

  @Post('me/assessment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitMyAssessment(
    @Req() req: RequestWithUser,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.usersService.submitAssessment(req.user.id, dto);
  }

  @Get('me/assessments')
  @UseGuards(JwtAuthGuard)
  async getMyAssessments(@Req() req: RequestWithUser) {
    return this.usersService.getAssessments(req.user.id);
  }

  @Post('me/upgrade')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async upgradeAccount(
    @Req() req: RequestWithUser,
    @Body() dto: UpgradeAccountDto,
  ) {
    return this.usersService.upgradeAccount(req.user.id, dto);
  }

  @Get('me/upgrades')
  @UseGuards(JwtAuthGuard)
  async getMyUpgradeHistory(@Req() req: RequestWithUser) {
    return this.usersService.getUpgradeHistory(req.user.id);
  }

  /**
   * Webhook endpoint for VietQR / banking automation (Casso / SePay / VietQR)
   * Processes concurrent payment notifications safely with ACID transaction guarantees.
   */
  @Post('webhook/vietqr')
  @HttpCode(HttpStatus.OK)
  async handleVietQrWebhook(@Body() dto: import('./dto/vietqr-webhook.dto').VietQrWebhookDto) {
    return this.usersService.upgradeAccount(dto.userId, {
      orderId: dto.orderId,
      plan: dto.plan,
      durationDays: dto.durationDays,
      amount: dto.amount,
    });
  }
}
