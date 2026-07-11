import {
  Controller,
  Post,
  Get,
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
}
