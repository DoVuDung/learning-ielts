import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getUsers: jest.fn(),
    updateUserPremium: jest.fn(),
    getTransactions: jest.fn(),
    approveTransaction: jest.fn(),
    getVideos: jest.fn(),
    createVideo: jest.fn(),
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

  it('calls adminService endpoints correctly', async () => {
    mockAdminService.getDashboardStats.mockResolvedValue({ totalUsers: 10 });
    mockAdminService.getUsers.mockResolvedValue([]);
    mockAdminService.updateUserPremium.mockResolvedValue({ id: 'u-1' });
    mockAdminService.getTransactions.mockResolvedValue([]);
    mockAdminService.approveTransaction.mockResolvedValue({ idempotent: true });
    mockAdminService.getVideos.mockResolvedValue([]);
    mockAdminService.createVideo.mockResolvedValue({ id: 'v-1' });

    expect(await controller.getDashboardStats()).toEqual({ totalUsers: 10 });
    expect(await controller.getUsers('abc')).toEqual([]);
    expect(
      await controller.updateUserPremium('u-1', { isPremium: true }),
    ).toEqual({ id: 'u-1' });
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
  });
});
