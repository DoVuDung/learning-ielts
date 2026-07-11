import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateUserPremium,
  updateUserRole,
  fetchAdminTransactions,
  approveTransaction,
  fetchAdminVideos,
  createAdminVideo,
} from './api';

describe('Admin API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAdminStats', () => {
    it('fetches stats correctly', async () => {
      const mockStats = { totalUsers: 10, premiumUsers: 5 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      } as any);

      const stats = await fetchAdminStats();
      expect(stats).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/admin/stats');
    });

    it('throws error when response not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      } as any);

      await expect(fetchAdminStats()).rejects.toThrow('Failed to fetch stats');
    });
  });

  describe('fetchAdminUsers', () => {
    it('fetches users without search query', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      } as any);

      await fetchAdminUsers();
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/admin/users');
    });

    it('fetches users with search query encoded correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      } as any);

      await fetchAdminUsers('andy do');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/users?search=andy%20do',
      );
    });
  });

  describe('updateUserPremium', () => {
    it('sends PATCH request to update user premium status', async () => {
      const mockUser = { id: 'u-1', isPremium: true };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      } as any);

      const res = await updateUserPremium('u-1', true, 30);
      expect(res).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/users/u-1/premium',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPremium: true, extendDays: 30 }),
        }),
      );
    });

    it('throws error if updateUserPremium fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false } as any);
      await expect(updateUserPremium('u-1', true)).rejects.toThrow(
        'Failed to update premium status',
      );
    });
  });

  describe('updateUserRole', () => {
    it('sends PATCH request to update user role', async () => {
      const mockUser = { id: 'u-1', role: 'ADMIN' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      } as any);

      const res = await updateUserRole('u-1', 'ADMIN');
      expect(res).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/users/u-1/role',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'ADMIN' }),
        }),
      );
    });

    it('throws error if updateUserRole fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false } as any);
      await expect(updateUserRole('u-1', 'ADMIN')).rejects.toThrow(
        'Failed to update user role',
      );
    });
  });

  describe('fetchAdminTransactions & approveTransaction', () => {
    it('fetches transactions list', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ orderId: 'ORD-1' }],
      } as any);

      const res = await fetchAdminTransactions();
      expect(res).toEqual([{ orderId: 'ORD-1' }]);
    });

    it('approves transaction with POST', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ idempotent: false }),
      } as any);

      const res = await approveTransaction('ORD-123');
      expect(res).toEqual({ idempotent: false });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/transactions/approve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ orderId: 'ORD-123' }),
        }),
      );
    });
  });

  describe('fetchAdminVideos & createAdminVideo', () => {
    it('fetches videos list', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ youtubeId: 'yt-1' }],
      } as any);

      await expect(fetchAdminVideos()).resolves.toEqual([{ youtubeId: 'yt-1' }]);
    });

    it('creates admin video with POST payload', async () => {
      const payload = {
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Title',
        category: 'ielts',
        level: 'C1',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'v-1', ...payload }),
      } as any);

      const res = await createAdminVideo(payload);
      expect(res.id).toBe('v-1');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/videos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
    });
  });
});
