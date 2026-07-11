import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TranscriptController', () => {
  let controller: TranscriptController;
  let service: TranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptController],
      providers: [
        {
          provide: TranscriptService,
          useValue: {
            fetch: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TranscriptController>(TranscriptController);
    service = module.get<TranscriptService>(TranscriptService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('fetch', () => {
    it('should throw BAD_REQUEST if videoId is missing', async () => {
      await expect(controller.fetch('', 'en')).rejects.toThrow(HttpException);
      try {
        await controller.fetch('', 'en');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return transcript items from service', async () => {
      const mockResult = [{ text: 'Hello', offset: 0, duration: 2, lang: 'en' }];
      jest.spyOn(service, 'fetch').mockResolvedValue(mockResult);

      const result = await controller.fetch('123', 'en');
      expect(result).toEqual(mockResult);
      expect(service.fetch).toHaveBeenCalledWith('123', 'en');
    });

    it('should map language error to NOT_FOUND', async () => {
      jest.spyOn(service, 'fetch').mockRejectedValue(new Error('No transcript available in language en'));

      try {
        await controller.fetch('123', 'en');
        fail('should throw');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should map other error to BAD_GATEWAY', async () => {
      jest.spyOn(service, 'fetch').mockRejectedValue(new Error('Network error'));

      try {
        await controller.fetch('123', 'en');
        fail('should throw');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      }
    });
  });
});
