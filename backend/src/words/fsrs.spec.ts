import { schedule, RATING, type CardSnapshot } from './fsrs';

const NOW = new Date('2026-05-26T12:00:00Z');

function newCard(): CardSnapshot {
  return {
    state: 'NEW',
    due: NOW,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
  };
}

function reviewCard(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    state: 'REVIEW',
    due: NOW,
    stability: 10,
    difficulty: 5,
    elapsedDays: 10,
    scheduledDays: 10,
    reps: 3,
    lapses: 0,
    lastReview: new Date(+NOW - 10 * 86_400_000),
    ...overrides,
  };
}

describe('fsrs scheduler', () => {
  describe('NEW card transitions', () => {
    it('Again (1) -> LEARNING', () => {
      const r = schedule(newCard(), RATING.Again, NOW);
      expect(r.state).toBe('LEARNING');
      expect(r.reps).toBe(1);
    });

    it('Hard (2) -> LEARNING', () => {
      const r = schedule(newCard(), RATING.Hard, NOW);
      expect(r.state).toBe('LEARNING');
    });

    it('Good (3) -> REVIEW', () => {
      const r = schedule(newCard(), RATING.Good, NOW);
      expect(r.state).toBe('REVIEW');
    });

    it('Easy (4) -> REVIEW', () => {
      const r = schedule(newCard(), RATING.Easy, NOW);
      expect(r.state).toBe('REVIEW');
    });
  });

  describe('LEARNING card transitions', () => {
    it('Again (1) keeps in LEARNING', () => {
      const card: CardSnapshot = { ...newCard(), state: 'LEARNING', reps: 1 };
      const r = schedule(card, RATING.Again, NOW);
      expect(r.state).toBe('LEARNING');
    });

    it('Good (3) transitions to REVIEW', () => {
      const card: CardSnapshot = { ...newCard(), state: 'LEARNING', reps: 1, stability: 2, difficulty: 5 };
      const r = schedule(card, RATING.Good, NOW);
      expect(r.state).toBe('REVIEW');
    });

    it('Easy (4) transitions to REVIEW', () => {
      const card: CardSnapshot = { ...newCard(), state: 'LEARNING', reps: 1, stability: 2, difficulty: 5 };
      const r = schedule(card, RATING.Easy, NOW);
      expect(r.state).toBe('REVIEW');
    });
  });

  describe('REVIEW card transitions', () => {
    it('Again (1) moves to RELEARNING and increments lapses', () => {
      const r = schedule(reviewCard(), RATING.Again, NOW);
      expect(r.state).toBe('RELEARNING');
      expect(r.lapses).toBe(1);
    });

    it('Hard (2) stays in REVIEW', () => {
      const r = schedule(reviewCard(), RATING.Hard, NOW);
      expect(r.state).toBe('REVIEW');
    });

    it('Good (3) stays in REVIEW and increases scheduledDays', () => {
      const r = schedule(reviewCard(), RATING.Good, NOW);
      expect(r.state).toBe('REVIEW');
      expect(r.scheduledDays).toBeGreaterThan(0);
    });

    it('Easy (4) stays in REVIEW with higher scheduledDays', () => {
      const rGood = schedule(reviewCard(), RATING.Good, NOW);
      const rEasy = schedule(reviewCard(), RATING.Easy, NOW);
      expect(rEasy.scheduledDays).toBeGreaterThanOrEqual(rGood.scheduledDays);
    });
  });

  describe('RELEARNING card transitions', () => {
    it('Again (1) stays in RELEARNING', () => {
      const card: CardSnapshot = { ...reviewCard(), state: 'RELEARNING', lapses: 1 };
      const r = schedule(card, RATING.Again, NOW);
      expect(r.state).toBe('RELEARNING');
    });

    it('Good (3) returns to REVIEW', () => {
      const card: CardSnapshot = { ...reviewCard(), state: 'RELEARNING', lapses: 1 };
      const r = schedule(card, RATING.Good, NOW);
      expect(r.state).toBe('REVIEW');
    });

    it('Easy (4) returns to REVIEW', () => {
      const card: CardSnapshot = { ...reviewCard(), state: 'RELEARNING', lapses: 1 };
      const r = schedule(card, RATING.Easy, NOW);
      expect(r.state).toBe('REVIEW');
    });
  });
});
