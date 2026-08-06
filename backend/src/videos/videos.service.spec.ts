import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';

global.fetch = jest.fn();
jest.mock('youtube-transcript');

describe('VideosService', () => {
  let service: VideosService;
  let prisma: PrismaService;

  const mockPrisma = {
    video: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should find videos created by user', async () => {
      const mockVideos = [{ id: 'v1', title: 'Test' }];
      mockPrisma.video.findMany.mockResolvedValue(mockVideos);

      const res = await service.findAllByUser('user1');
      expect(res).toEqual(mockVideos);
      expect(mockPrisma.video.findMany).toHaveBeenCalledWith({
        where: { createdById: 'user1' },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sentences: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a video with sentences if found', async () => {
      const mockVideo = { id: 'v1', sentences: [] };
      mockPrisma.video.findUnique.mockResolvedValue(mockVideo);

      const res = await service.findOne('v1');
      expect(res).toEqual(mockVideo);
    });

    it('should throw NotFoundException if video not found', async () => {
      mockPrisma.video.findUnique.mockResolvedValue(null);
      await expect(service.findOne('v1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a video if found for user', async () => {
      mockPrisma.video.findFirst.mockResolvedValue({ id: 'v1', createdById: 'u1' });
      mockPrisma.video.delete.mockResolvedValue({ id: 'v1' });

      const res = await service.remove('v1', 'u1');
      expect(res).toEqual({ ok: true });
      expect(mockPrisma.video.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });

    it('should throw NotFoundException if video not found for user', async () => {
      mockPrisma.video.findFirst.mockResolvedValue(null);
      await expect(service.remove('v1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('importVideo', () => {
    it('should throw UnprocessableEntityException on invalid YouTube URL', async () => {
      await expect(service.importVideo({ url: 'invalid-url' }, 'u1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should return existing video if already imported', async () => {
      mockPrisma.video.findFirst.mockResolvedValue({ id: 'existing-id' });

      const res = await service.importVideo(
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        'u1',
      );
      expect(res).toEqual({ id: 'existing-id' });
    });

    it('should import video with sentences using YoutubeTranscript', async () => {
      mockPrisma.video.findFirst.mockResolvedValue(null);

      // Mock oembed for metadata
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Test YouTube Title' }),
      });

      // Mock YoutubeTranscript for transcript
      (YoutubeTranscript.fetchTranscript as jest.Mock).mockResolvedValueOnce([
        { text: 'Hello world.', offset: 0, duration: 2000 },
        { text: 'This is sentence two', offset: 2000, duration: 3000 },
      ]);

      mockPrisma.video.create.mockResolvedValue({ id: 'new-v1', title: 'Test YouTube Title' });

      const res = await service.importVideo(
        { url: 'https://youtu.be/dQw4w9WgXcQ' },
        'u1',
      );

      expect(res).toEqual({ id: 'new-v1', title: 'Test YouTube Title' });
      expect(mockPrisma.video.create).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if no transcript available', async () => {
      mockPrisma.video.findFirst.mockResolvedValue(null);

      // oembed fails → default title
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      // All YoutubeTranscript.fetchTranscript calls throw
      (YoutubeTranscript.fetchTranscript as jest.Mock).mockRejectedValue(
        new Error('No transcript'),
      );

      await expect(
        service.importVideo({ url: 'https://youtube.com/shorts/abc12345678' }, 'u1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should handle embed URL format', async () => {
      mockPrisma.video.findFirst.mockResolvedValue({ id: 'existing-embed' });
      const res = await service.importVideo(
        { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        'u1',
      );
      expect(res).toEqual({ id: 'existing-embed' });
    });

    it('should fall back to en-US if en-GB not available', async () => {
      mockPrisma.video.findFirst.mockResolvedValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Title' }),
      });

      // en-GB throws, en-US succeeds
      (YoutubeTranscript.fetchTranscript as jest.Mock)
        .mockRejectedValueOnce(new Error('lang not available'))
        .mockResolvedValueOnce([
          { text: 'Hello from en-US.', offset: 0, duration: 1500 },
        ]);

      mockPrisma.video.create.mockResolvedValue({ id: 'en-us-video' });

      const res = await service.importVideo(
        { url: 'https://www.youtube.com/watch?v=enUS1234567' },
        'u1',
      );
      expect(res).toEqual({ id: 'en-us-video' });
    });

    it('should fall back to language-agnostic fetch if all lang attempts fail', async () => {
      mockPrisma.video.findFirst.mockResolvedValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Title' }),
      });

      // en-GB, en-US, en all throw; last-resort fallback succeeds
      (YoutubeTranscript.fetchTranscript as jest.Mock)
        .mockRejectedValueOnce(new Error('no en-GB'))
        .mockRejectedValueOnce(new Error('no en-US'))
        .mockRejectedValueOnce(new Error('no en'))
        .mockResolvedValueOnce([
          { text: 'Xin chao.', offset: 0, duration: 1000 },
        ]);

      mockPrisma.video.create.mockResolvedValue({ id: 'vi-video' });

      const res = await service.importVideo(
        { url: 'https://www.youtube.com/watch?v=vi123456789' },
        'u1',
      );
      expect(res).toEqual({ id: 'vi-video' });
    });
  });
});
