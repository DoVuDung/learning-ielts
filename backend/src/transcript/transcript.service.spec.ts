import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptService } from './transcript.service';
import { YoutubeTranscript } from 'youtube-transcript';

jest.mock('youtube-transcript');

describe('TranscriptService', () => {
  let service: TranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TranscriptService],
    }).compile();

    service = module.get<TranscriptService>(TranscriptService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch transcript and format lines properly defaulting to en if unsupported lang', async () => {
    (YoutubeTranscript.fetchTranscript as jest.Mock).mockResolvedValue([
      { text: 'Hello\nworld', offset: 100.4, duration: 200.6, lang: 'en' },
    ]);

    const result = await service.fetch('vid123', 'fr');
    expect(YoutubeTranscript.fetchTranscript).toHaveBeenCalledWith('vid123', { lang: 'en' });
    expect(result).toEqual([
      { text: 'Hello world', offset: 100, duration: 201, lang: 'en' },
    ]);
  });

  it('should use allowed lang if provided', async () => {
    (YoutubeTranscript.fetchTranscript as jest.Mock).mockResolvedValue([
      { text: 'Xin chào', offset: 0, duration: 10, lang: 'vi' },
    ]);

    const result = await service.fetch('vid123', 'vi');
    expect(YoutubeTranscript.fetchTranscript).toHaveBeenCalledWith('vid123', { lang: 'vi' });
    expect(result).toEqual([
      { text: 'Xin chào', offset: 0, duration: 10, lang: 'vi' },
    ]);
  });

  it('should throw if non-latin script detected in transcript', async () => {
    (YoutubeTranscript.fetchTranscript as jest.Mock).mockResolvedValue([
      { text: 'مرحبا بك', offset: 0, duration: 10, lang: 'en' },
    ]);

    await expect(service.fetch('vid123', 'en')).rejects.toThrow('Transcript language not supported');
  });
});
