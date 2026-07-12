import { Test, TestingModule } from '@nestjs/testing';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';

describe('WordsController', () => {
  let controller: WordsController;

  const mockWordsService = {
    findAll: jest.fn().mockResolvedValue([{ id: 'n1', word: 'ubiquitous' }]),
    save: jest.fn().mockResolvedValue({ id: 'n1', word: 'ubiquitous' }),
    importLlmNotes: jest.fn().mockResolvedValue({ success: true, importedCount: 1 }),
    remove: jest.fn().mockResolvedValue({ ok: true }),
    review: jest.fn().mockResolvedValue({ id: 'c1', reps: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WordsController],
      providers: [
        {
          provide: WordsService,
          useValue: mockWordsService,
        },
      ],
    }).compile();

    controller = module.get<WordsController>(WordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all notes', async () => {
    const req: any = { user: { sub: 'user1' } };
    expect(await controller.findAll(req)).toEqual([{ id: 'n1', word: 'ubiquitous' }]);
  });

  it('should save a note', async () => {
    const req: any = { user: { sub: 'user1' } };
    expect(await controller.save(req, { word: 'ubiquitous' })).toEqual({
      id: 'n1',
      word: 'ubiquitous',
    });
  });

  it('should import llm notes', async () => {
    const req: any = { user: { sub: 'user1' } };
    expect(
      await controller.importLlmNotes(req, { rawText: '1. Ubiquitous - present everywhere' }),
    ).toEqual({ success: true, importedCount: 1 });
  });

  it('should remove a note', async () => {
    const req: any = { user: { sub: 'user1' } };
    expect(await controller.remove(req, { word: 'ubiquitous' })).toEqual({ ok: true });
  });

  it('should review a card', async () => {
    const req: any = { user: { sub: 'user1' } };
    expect(await controller.review(req, { cardId: 'c1', rating: 3 })).toEqual({
      id: 'c1',
      reps: 1,
    });
  });
});
