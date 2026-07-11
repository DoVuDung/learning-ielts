/**
 * Centralised HTTP client for the NestJS backend.
 * All requests include credentials (HttpOnly cookie) automatically.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const raw = await res.text();
    let errorMessage = `HTTP ${res.status}`;
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.message) {
          errorMessage = Array.isArray(parsed.message)
            ? parsed.message.join(', ')
            : String(parsed.message);
        } else if (parsed?.error) {
          errorMessage = String(parsed.error);
        } else {
          errorMessage = raw;
        }
      }
    } catch {
      errorMessage = raw || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Some endpoints return empty body (204)
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Start Google OAuth flow — redirect browser to BE */
  googleLoginUrl: () => `${BASE_URL}/auth/google`,

  me: () => request<{ id: string; email: string; name: string; avatarUrl: string | null; isPremium: boolean }>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout'),
};

// ─── Videos ───────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  level: string;
  createdAt: string;
  _count?: { sentences: number };
}

export interface VideoDetail extends Video {
  sentences: Array<{
    id: string;
    index: number;
    text: string;
    startMs: number;
    endMs: number;
  }>;
}

export const videosApi = {
  list: () => request<Video[]>('/videos'),

  get: (id: string) => request<VideoDetail>(`/videos/${id}`),

  import: (data: { url: string; category?: string; level?: string }) =>
    request<Video>('/videos/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ ok: boolean }>(`/videos/${id}`, { method: 'DELETE' }),
};

// ─── Transcript ───────────────────────────────────────────────────────────────

export interface TranscriptLine {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

export const transcriptApi = {
  fetch: (videoId: string, lang = 'en') =>
    request<TranscriptLine[]>(`/transcript?videoId=${encodeURIComponent(videoId)}&lang=${lang}`),
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface DictationProgress {
  id?: string;
  videoId?: string;
  sentencesDone: number;
  totalSentences: number;
  completedAt?: string | null;
}

export const progressApi = {
  getAll: () => request<DictationProgress[]>('/progress'),

  getByVideo: (videoId: string) =>
    request<DictationProgress>(`/progress?videoId=${encodeURIComponent(videoId)}`),

  upsert: (data: { videoId: string; sentencesDone: number; totalSentences: number }) =>
    request<DictationProgress>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Words ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  word: string;
  definition: string | null;
  context: string | null;
  videoId: string | null;
  createdAt: string;
  cards: Card[];
}

export interface Card {
  id: string;
  noteId: string;
  template: string;
  state: string;
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
}

export const wordsApi = {
  list: () => request<Note[]>('/words'),

  save: (data: { word: string; context?: string; videoId?: string; definition?: string }) =>
    request<Note>('/words', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (word: string) =>
    request<{ ok: boolean }>('/words', {
      method: 'DELETE',
      body: JSON.stringify({ word }),
    }),

  review: (cardId: string, rating: 1 | 2 | 3 | 4) =>
    request<Card>('/words/review', {
      method: 'POST',
      body: JSON.stringify({ cardId, rating }),
    }),
};

// ─── Speaking ─────────────────────────────────────────────────────────────────

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Returns a ReadableStream of text chunks from the AI.
 * Caller is responsible for reading the stream.
 */
export async function streamSpeakingReply(
  messages: ChatMessage[],
  topic: string,
  apiKey?: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE_URL}/speaking`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, topic, ...(apiKey && { apiKey }) }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let errorMessage = `HTTP ${res.status}`;
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        errorMessage = Array.isArray(parsed?.message)
          ? parsed.message.join(', ')
          : (parsed?.message || parsed?.error || raw);
      }
    } catch {
      errorMessage = raw || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.body!;
}

// ─── Users & Target / Assessment ──────────────────────────────────────────────

export interface UserTarget {
  id: string;
  targetIeltsBand: number | null;
  targetCefrLevel: string | null;
  dailyMinutesTarget: number | null;
  currentLevel: string | null;
  assessedAt: string | null;
  latestAssessment?: AssessmentResult | null;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  score: number;
  cefrLevel: string;
  ieltsBand: number;
  listeningScore: number;
  vocabularyScore: number;
  grammarScore: number;
  answersJson: string;
  createdAt: string;
}

export const usersApi = {
  getTarget: () => request<UserTarget>('/users/me/target'),

  updateTarget: (data: {
    targetIeltsBand?: number;
    targetCefrLevel?: string;
    dailyMinutesTarget?: number;
  }) =>
    request<UserTarget>('/users/me/target', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submitAssessment: (answers: { questionId: string; selectedAnswer: string }[]) =>
    request<AssessmentResult>('/users/me/assessment', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getAssessments: () => request<AssessmentResult[]>('/users/me/assessments'),
};

