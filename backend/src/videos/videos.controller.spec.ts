import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

describe('VideosController', () => {
  let controller: VideosController;
  let service: VideosService;

  const mockVideosService = {
    findAllByUser: jest.fn().mockResolvedValue([{ id: 'v1', title: 'TED' }]),
    findOne: jest.fn().mockResolvedValue({ id: 'v1', title: 'TED' }),
    importVideo: jest.fn().mockResolvedValue({ id: 'v1', title: 'Imported' }),
    remove: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: mockVideosService,
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all videos by user', async () => {
    const req: any = { user: { sub: 'user1' } };
    const res = await controller.findAll(req);
    expect(res).toEqual([{ id: 'v1', title: 'TED' }]);
    expect(service.findAllByUser).toHaveBeenCalledWith('user1');
  });

  it('should find one video by id', async () => {
    const res = await controller.findOne('v1');
    expect(res).toEqual({ id: 'v1', title: 'TED' });
  });

  it('should import video', async () => {
    const req: any = { user: { sub: 'user1' } };
    const dto: any = { url: 'https://youtube.com/watch?v=123' };
    const res = await controller.importVideo(dto, req);
    expect(res).toEqual({ id: 'v1', title: 'Imported' });
  });

  it('should remove video', async () => {
    const req: any = { user: { sub: 'user1' } };
    const res = await controller.remove('v1', req);
    expect(res).toEqual({ ok: true });
  });
});
