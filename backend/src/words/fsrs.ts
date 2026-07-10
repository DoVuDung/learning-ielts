// FSRS-5 scheduler — port of the open-spaced-repetition algorithm used by modern Anki.
// Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export type State = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export const RATING = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const;

export interface CardSnapshot {
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: Date | null;
}

export interface SchedulingResult {
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: Date;
}

const W: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655,
  0.6621,
];

const REQUEST_RETENTION = 0.9;
const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const MAX_INTERVAL = 36500;

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const initStability = (g: Rating) => Math.max(W[g - 1], 0.1);
const initDifficulty = (g: Rating) => clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
const meanReversion = (init: number, current: number) => W[7] * init + (1 - W[7]) * current;

const nextDifficulty = (d: number, g: Rating) => {
  const dPrime = d - W[6] * (g - 3);
  return clamp(meanReversion(initDifficulty(4), dPrime), 1, 10);
};

const recallStability = (d: number, s: number, r: number, g: Rating) => {
  const hardPenalty = g === 2 ? W[15] : 1;
  const easyBonus = g === 4 ? W[16] : 1;
  return (
    s *
    (1 +
      Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp((1 - r) * W[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
};

const forgetStability = (d: number, s: number, r: number) =>
  W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);

const retrievability = (elapsedDays: number, stability: number) =>
  stability <= 0 ? 0 : Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);

const intervalFromStability = (stability: number) => {
  const days = (stability / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1);
  return clamp(Math.round(days), 1, MAX_INTERVAL);
};

const addDays = (now: Date, days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
};

const addMinutes = (now: Date, mins: number) => {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() + mins);
  return d;
};

const LEARNING_STEPS_MIN: Record<Rating, number> = { 1: 1, 2: 5, 3: 10, 4: 0 };
const RELEARNING_STEPS_MIN: Record<Rating, number> = { 1: 5, 2: 10, 3: 10, 4: 0 };

export function schedule(card: CardSnapshot, rating: Rating, now: Date = new Date()): SchedulingResult {
  const elapsed =
    card.lastReview == null
      ? 0
      : Math.max(0, Math.floor((+now - +card.lastReview) / 86_400_000));

  let { stability, difficulty, reps, lapses } = card;
  let state: State = card.state;

  if (state === 'NEW') {
    difficulty = initDifficulty(rating);
    stability = initStability(rating);
  } else {
    const r = retrievability(elapsed, stability);
    if (rating === 1) {
      stability = forgetStability(difficulty, stability, r);
      lapses += 1;
    } else {
      stability = recallStability(difficulty, stability, r, rating);
    }
    difficulty = nextDifficulty(difficulty, rating);
  }

  reps += 1;

  let due: Date;
  let scheduledDays: number;

  if (state === 'NEW' || state === 'LEARNING') {
    if (rating === 4) {
      state = 'REVIEW';
      scheduledDays = intervalFromStability(stability);
      due = addDays(now, scheduledDays);
    } else {
      state = 'LEARNING';
      scheduledDays = 0;
      due = addMinutes(now, LEARNING_STEPS_MIN[rating]);
      if (rating === 3) {
        state = 'REVIEW';
        scheduledDays = intervalFromStability(stability);
        due = addDays(now, scheduledDays);
      }
    }
  } else if (state === 'REVIEW') {
    if (rating === 1) {
      state = 'RELEARNING';
      scheduledDays = 0;
      due = addMinutes(now, RELEARNING_STEPS_MIN[1]);
    } else {
      scheduledDays = intervalFromStability(stability);
      due = addDays(now, scheduledDays);
    }
  } else {
    // RELEARNING
    if (rating === 1) {
      scheduledDays = 0;
      due = addMinutes(now, RELEARNING_STEPS_MIN[1]);
    } else {
      state = 'REVIEW';
      scheduledDays = intervalFromStability(stability);
      due = addDays(now, scheduledDays);
    }
  }

  return { state, due, stability, difficulty, elapsedDays: elapsed, scheduledDays, reps, lapses, lastReview: now };
}
