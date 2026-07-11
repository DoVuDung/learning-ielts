import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    isPremium: true,
  };

  const mockUsersService = {
    findById: jest.fn(),
    upgradeAccount: jest.fn(),
    getUpgradeHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('returns the current authenticated user profile', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const req: any = { user: { id: 'user-1' } };
      const result = await controller.getMyProfile(req);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('upgradeAccount', () => {
    it('calls usersService.upgradeAccount with user id and dto', async () => {
      const dto = {
        orderId: 'ORDER-100',
        plan: 'PREMIUM_1_YEAR',
        durationDays: 365,
        amount: 500000,
      };
      const expectedResponse = {
        user: { ...mockUser, isPremium: true },
        transaction: { id: 'tx-1', orderId: 'ORDER-100' },
        idempotent: false,
      };
      mockUsersService.upgradeAccount.mockResolvedValue(expectedResponse);

      const req: any = { user: { id: 'user-1' } };
      const result = await controller.upgradeAccount(req, dto);

      expect(result).toEqual(expectedResponse);
      expect(mockUsersService.upgradeAccount).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getMyUpgradeHistory', () => {
    it('calls usersService.getUpgradeHistory with user id', async () => {
      const history = [{ id: 'tx-1', orderId: 'ORDER-100' }];
      mockUsersService.getUpgradeHistory.mockResolvedValue(history);

      const req: any = { user: { id: 'user-1' } };
      const result = await controller.getMyUpgradeHistory(req);

      expect(result).toEqual(history);
      expect(mockUsersService.getUpgradeHistory).toHaveBeenCalledWith('user-1');
    });
  });

  describe('handleVietQrWebhook', () => {
    it('calls usersService.upgradeAccount with webhook dto', async () => {
      const dto = {
        userId: 'user-1',
        orderId: 'VIETQR-999',
        plan: 'PREMIUM_MONTHLY',
        durationDays: 30,
        amount: 199000,
      };
      const expectedResponse = {
        user: { ...mockUser, isPremium: true },
        transaction: { id: 'tx-2', orderId: 'VIETQR-999' },
        idempotent: false,
      };
      mockUsersService.upgradeAccount.mockResolvedValue(expectedResponse);

      const result = await controller.handleVietQrWebhook(dto);

      expect(result).toEqual(expectedResponse);
      expect(mockUsersService.upgradeAccount).toHaveBeenCalledWith('user-1', {
        orderId: 'VIETQR-999',
        plan: 'PREMIUM_MONTHLY',
        durationDays: 30,
        amount: 199000,
      });
    });
  });
});
