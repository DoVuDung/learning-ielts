# Senglish – IELTS Learning App

@AGENTS.md

An IELTS learning platform with dictation, shadowing, speaking practice, and spaced-repetition vocabulary — built with Next.js 16, Tailwind CSS v4, and shadcn/ui (nova preset).

## Stack

- **Framework**: Next.js 16 App Router (TypeScript, RSC by default)
- **Styling**: Tailwind CSS v4 with `@theme inline` — no `tailwind.config.js`
- **UI components**: shadcn/ui (`nova` preset, `radix` base, `lucide-react` icons)
- **Font**: Inter (via `next/font/google`, mapped to `--font-sans`)
- **Database**: PostgreSQL via Prisma 7 (`lib/prisma.ts`)
- **Auth**: Google OAuth 2.0 → JWT in HttpOnly cookie (`access_token`, 7d)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) for speaking practice
- **Package manager**: npm

## Design System

The app is **always dark** — no light mode. All tokens live in `app/globals.css` under `:root`.

| Token | Value | Usage |
| --- | --- | --- |
| `--background` | `oklch(0.09 0 0)` ≈ `#0F0F0F` | Page background |
| `--card` | `oklch(0.14 0 0)` ≈ `#1A1A1A` | Card surfaces |
| `--primary` | `oklch(0.58 0.23 357deg)` ≈ `#E91E63` | Active states, buttons, accents |
| `--sidebar` | `oklch(0.12 0 0)` | Sidebar background |
| `--muted-foreground` | `oklch(0.60 0 0)` | Secondary labels |

**Never add a `.dark` class or `dark:` prefixes** — the palette is baked into `:root` directly.

## Route Groups

```text
app/
  (auth)/             ← unauthenticated: login, OAuth callback
  (main)/             ← protected by middleware; has side-nav + top-nav layout
    home/             ← landing dashboard
    dictation/        ← video list; [videoId]/ for the player
    shadowing/        ← video list; [videoId]/ for the player
    speaking/         ← AI conversation practice
    vocabulary/       ← FSRS flashcard review
    word-lists/       ← saved words management
    my-videos/        ← import YouTube videos
    stats/            ← progress stats
    leaderboard/      ← global rankings
    dictionary/       ← word lookup
```

## Authentication

- `GET /api/auth/google` — redirects to Google consent screen
- `GET /api/auth/google/callback` — exchanges code, sets `access_token` cookie, redirects to `/dictation`
- `GET /api/auth/me` — returns current user from JWT
- `POST /api/auth/logout` — clears cookie
- `middleware.ts` — redirects unauthenticated users to `/login`; redirects authenticated users away from `/login`
- `lib/auth.ts` — `signToken`, `verifyToken`, `getSession`, `setTokenCookie`

## Database Models (Prisma)

- **User** — Google OAuth identity
- **Video** — YouTube video imported by a user; `@@unique([youtubeId, createdById])`
- **Sentence** — transcript segments with `startMs`/`endMs`
- **DictationProgress** — sentences done per user/video
- **Note** — saved vocabulary word with optional context/tags; `@@unique([userId, word])`
- **Card** — FSRS card linked to a Note; templates: `WORD_TO_MEANING`, `MEANING_TO_WORD`, `LISTENING`
- **ReviewLog** — every card review event for replay/analytics

Run migrations: `npx prisma migrate dev`. Generate client: `npx prisma generate` (also runs in `npm run build`).

## FSRS Spaced Repetition

`lib/fsrs.ts` implements FSRS-5 (port of open-spaced-repetition). Ratings: 1 Again, 2 Hard, 3 Good, 4 Easy. Used in `app/(main)/vocabulary/` and `app/api/words/review/route.ts`.

## API Routes

| Route | Purpose |
| --- | --- |
| `/api/videos` | List / create videos |
| `/api/videos/import` | Import YouTube video + transcript |
| `/api/videos/[id]` | Get / delete a video |
| `/api/transcript` | Fetch transcript for a video |
| `/api/progress` | Read / update dictation progress |
| `/api/words` | CRUD saved words (Notes + Cards) |
| `/api/words/review` | Submit a card review (FSRS scheduling) |
| `/api/speaking` | Stream AI speaking feedback via Anthropic |

All routes read session via `getSession()` and return 401 if unauthenticated.

## Component Conventions

- All interactive components using `useState`/`useEffect`/events need `"use client"` at the top.
- Server components (pages, grids, data layouts) have no directive — RSC by default.
- Props interfaces use `Readonly<{...}>`.
- Explicit typed interfaces live in the file that uses them — avoid a shared `types/` file unless shared across 3+ components.

## File Layout

```text
app/
  globals.css               ← CSS variables + Tailwind imports
  layout.tsx                ← root layout (Inter font)
  (auth)/login/page.tsx     ← Google sign-in page
  (main)/layout.tsx         ← shell with SideNav + TopNav
  (main)/dictation/[videoId]/dictation-player.tsx  ← "use client"
  (main)/shadowing/[videoId]/shadowing-player.tsx  ← "use client"
  (main)/vocabulary/flashcard-review.tsx           ← "use client"
  (main)/speaking/speaking-chat.tsx                ← "use client"

components/
  side-nav.tsx              ← "use client" — usePathname for active links
  top-nav.tsx               ← "use client" — sticky header
  filter-bar.tsx            ← "use client" — category + level chips
  video-card.tsx            ← RSC
  lesson-grid.tsx           ← RSC
  components/ui/            ← shadcn/ui — do not edit directly

lib/
  auth.ts                   ← JWT helpers
  prisma.ts                 ← Prisma client singleton
  fsrs.ts                   ← FSRS-5 scheduler
  utils.ts                  ← cn() and misc helpers
  i18n.ts / locale-context.tsx  ← i18n (if used)

backend/                    ← NestJS service on port 3001 (Docker only)
prisma/
  schema.prisma
  migrations/
```

## Image Domains

Whitelisted in `next.config.ts`: `i.ytimg.com` (YouTube thumbnails) and `api.dicebear.com` (avatars).

## Styling Rules

- `cn()` from `@/lib/utils` for conditional classes.
- `size-*` for square elements, never `w-* h-*`.
- `gap-*` for spacing, never `space-x-*` / `space-y-*`.
- `truncate` shorthand over the three-property expansion.
- Semantic tokens only (`bg-card`, `text-muted-foreground`) — never raw hex or Tailwind color scales like `bg-zinc-800`.

## Environment Variables

```bash
DATABASE_URL=          # PostgreSQL connection string
DIRECT_URL=            # Direct DB URL (for Prisma migrations)
JWT_SECRET=            # Secret for signing access tokens
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=   # e.g. http://localhost:3000/api/auth/google/callback
ANTHROPIC_API_KEY=     # For /api/speaking
NEXT_PUBLIC_API_URL=   # Points to backend service (Docker mode)
```

## Running

```bash
npm run dev            # Next.js dev server — http://localhost:3000
npm run build          # prisma generate + next build
npx tsc --noEmit       # type-check only
npm test               # Vitest unit tests
npm run test:e2e       # Playwright e2e tests
docker-compose up      # Full stack (frontend + NestJS backend)
```

## Testing

- **Unit**: Vitest + Testing Library — `__tests__/` and co-located `*.test.ts` files
- **E2E**: Playwright — `e2e/` directory, config in `playwright.config.ts`
