import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

describe('ProgressController', () => {
  let controller: ProgressController;
  let service: ProgressService;

  const mockProgressService = {
    findByVideo: jest.fn().mockResolvedValue({ id: 'p1', videoId: 'vid1' }),
    findAll: jest.fn().mockResolvedValue([{ id: 'p1', videoId: 'vid1' }]),
    upsert: jest.fn().mockResolvedValue({ id: 'p1', sentencesDone: 5 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    service = module.get<ProgressService>(ProgressService);
  });

  it('should find progress by videoId when provided', async () => {
    const req: any = { user: { sub: 'u1' } };
    expect(await controller.find(req, 'vid1')).toEqual({ id: 'p1', videoId: 'vid1' });
    expect(service.findByVideo).toHaveBeenCalledWith('u1', 'vid1');
  });

  it('should find all progress when videoId not provided', async () => {
    const req: any = { user: { sub: 'u1' } };
    expect(await controller.find(req)).toEqual([{ id: 'p1', videoId: 'vid1' }]);
    expect(service.findAll).toHaveBeenCalledWith('u1');
  });

  it('should upsert progress', async () => {
    const req: any = { user: { sub: 'u1' } };
    expect(
      await controller.upsert(req, { videoId: 'vid1', sentencesDone: 5, totalSentences: 10 }),
    ).toEqual({ id: 'p1', sentencesDone: 5 });
  });
});
