import { Test, TestingModule } from '@nestjs/testing';
import { SpeakingController } from './speaking.controller';
import { SpeakingService } from './speaking.service';

describe('SpeakingController', () => {
  let controller: SpeakingController;

  const mockReadable = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('Hello'));
      controller.close();
    },
  });

  const mockSpeakingService = {
    streamResponse: jest.fn().mockResolvedValue(mockReadable),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeakingController],
      providers: [
        {
          provide: SpeakingService,
          useValue: mockSpeakingService,
        },
      ],
    }).compile();

    controller = module.get<SpeakingController>(SpeakingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should stream reply via chat method', async () => {
    const resMock: any = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    await controller.chat(
      { messages: [{ role: 'user', content: 'hello' }], topic: 'ielts' },
      resMock,
    );

    expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(resMock.setHeader).toHaveBeenCalledWith('Transfer-Encoding', 'chunked');
    expect(resMock.write).toHaveBeenCalled();
    expect(resMock.end).toHaveBeenCalled();
  });
});
