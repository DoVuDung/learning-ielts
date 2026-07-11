import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  UpdateUserPremiumDto,
  ManualApproveTransactionDto,
  AdminCreateVideoDto,
} from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/premium')
  async updateUserPremium(
    @Param('id') userId: string,
    @Body() dto: UpdateUserPremiumDto,
  ) {
    return this.adminService.updateUserPremium(userId, dto);
  }

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getTransactions();
  }

  @Post('transactions/approve')
  @HttpCode(HttpStatus.OK)
  async approveTransaction(@Body() dto: ManualApproveTransactionDto) {
    return this.adminService.approveTransaction(dto);
  }

  @Get('videos')
  async getVideos() {
    return this.adminService.getVideos();
  }

  @Post('videos')
  async createVideo(@Body() dto: AdminCreateVideoDto) {
    return this.adminService.createVideo(dto);
  }
}
