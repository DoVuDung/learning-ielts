import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  UpdateUserPremiumDto,
  UpdateUserRoleDto,
  ManualApproveTransactionDto,
  AdminCreateVideoDto,
  AdminUpdateVideoDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
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

  @Patch('videos/:id')
  async updateVideo(
    @Param('id') id: string,
    @Body() dto: AdminUpdateVideoDto,
  ) {
    return this.adminService.updateVideo(id, dto);
  }

  @Delete('videos/:id')
  async deleteVideo(@Param('id') id: string) {
    return this.adminService.deleteVideo(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:userId/notes/import-llm')
  async importLlmNotesForUser(
    @Param('userId') userId: string,
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
    return this.adminService.importLlmNotesForUser(userId, body);
  }
}
