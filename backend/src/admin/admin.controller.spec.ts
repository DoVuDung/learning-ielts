import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getUsers: jest.fn(),
    updateUserPremium: jest.fn(),
    updateUserRole: jest.fn(),
    getTransactions: jest.fn(),
    approveTransaction: jest.fn(),
    getVideos: jest.fn(),
    createVideo: jest.fn(),
    updateVideo: jest.fn(),
    deleteVideo: jest.fn(),
    deleteUser: jest.fn(),
    importLlmNotesForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to adminService', async () => {
    mockAdminService.getDashboardStats.mockResolvedValue({ totalUsers: 10 });
    mockAdminService.getUsers.mockResolvedValue([]);
    mockAdminService.updateUserPremium.mockResolvedValue({ id: 'u-1' });
    mockAdminService.updateUserRole.mockResolvedValue({
      id: 'u-1',
      role: 'ADMIN',
    });
    mockAdminService.getTransactions.mockResolvedValue([]);
    mockAdminService.approveTransaction.mockResolvedValue({ idempotent: true });
    mockAdminService.getVideos.mockResolvedValue([]);
    mockAdminService.createVideo.mockResolvedValue({ id: 'v-1' });
    mockAdminService.updateVideo.mockResolvedValue({ id: 'v-1', title: 'New' });
    mockAdminService.deleteVideo.mockResolvedValue({ ok: true });
    mockAdminService.deleteUser.mockResolvedValue({ ok: true });
    mockAdminService.importLlmNotesForUser.mockResolvedValue({
      success: true,
      importedCount: 2,
    });

    expect(await controller.getDashboardStats()).toEqual({ totalUsers: 10 });
    expect(await controller.getUsers('abc')).toEqual([]);
    expect(
      await controller.updateUserPremium('u-1', { isPremium: true }),
    ).toEqual({ id: 'u-1' });
    expect(
      await controller.updateUserRole('u-1', { role: 'ADMIN' as any }),
    ).toEqual({ id: 'u-1', role: 'ADMIN' });
    expect(await controller.getTransactions()).toEqual([]);
    expect(
      await controller.approveTransaction({ orderId: 'ORD-1' }),
    ).toEqual({ idempotent: true });
    expect(await controller.getVideos()).toEqual([]);
    expect(
      await controller.createVideo({
        youtubeId: 'yt-1',
        title: 'T',
        category: 'cat',
        level: 'B1',
      }),
    ).toEqual({ id: 'v-1' });
    expect(await controller.updateVideo('v-1', { title: 'New' })).toEqual({
      id: 'v-1',
      title: 'New',
    });
    expect(await controller.deleteVideo('v-1')).toEqual({ ok: true });
    expect(await controller.deleteUser('u-1')).toEqual({ ok: true });
    expect(
      await controller.importLlmNotesForUser('u-1', {
        rawText: '1. ubiquitous - everywhere',
      }),
    ).toEqual({ success: true, importedCount: 2 });
  });
});
