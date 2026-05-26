export interface UserStats {
  id: string;
  name: string;
  avatarUrl: string | null;
  sentencesDone: number;
  reviewsDone: number;
  wordsSaved: number;
}

export interface RankedUser extends UserStats {
  score: number;
}

export function computeScore(u: Pick<UserStats, "sentencesDone" | "reviewsDone" | "wordsSaved">): number {
  return u.sentencesDone + u.reviewsDone * 2 + u.wordsSaved;
}

export function rankUsers(users: UserStats[]): RankedUser[] {
  return users
    .map((u) => ({ ...u, score: computeScore(u) }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score);
}
