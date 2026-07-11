import { Test, TestingModule } from '@nestjs/testing';
import { SpeakingService } from './speaking.service';
import { ServiceUnavailableException } from '@nestjs/common';

const mockStream = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      stream: mockStream,
    },
  }));
  return {
    __esModule: true,
    default: MockAnthropic,
  };
});

describe('SpeakingService', () => {
  let service: SpeakingService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeakingService],
    }).compile();

    service = module.get<SpeakingService>(SpeakingService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ServiceUnavailableException if no API key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      service.streamResponse([{ role: 'user', content: 'hello' }], 'IELTS'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should use userApiKey if ANTHROPIC_API_KEY is not set or your-key-here', async () => {
    process.env.ANTHROPIC_API_KEY = 'your-key-here';

    async function* asyncGenerator() {
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'Hello ' },
      };
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'world' },
      };
    }

    mockStream.mockResolvedValue(asyncGenerator());

    const stream = await service.streamResponse(
      [{ role: 'user', content: 'hello' }],
      'IELTS',
      'user-provided-key',
    );

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    );

    const reader = stream.getReader();
    const chunks: string[] = [];
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value));
    }
    expect(chunks.join('')).toBe('Hello world');
  });

  it('should forward stream error to controller.error', async () => {
    process.env.ANTHROPIC_API_KEY = 'valid-key';

    async function* errorGenerator() {
      throw new Error('Stream failed');
    }

    mockStream.mockResolvedValue(errorGenerator());

    const stream = await service.streamResponse(
      [{ role: 'user', content: 'hi' }],
      'IELTS',
    );

    const reader = stream.getReader();
    await expect(reader.read()).rejects.toThrow('Stream failed');
  });
});
