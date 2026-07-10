# BapEnglish — IELTS Learning Platform

A full-stack IELTS English learning platform with dictation practice, vocabulary management with FSRS-5 spaced repetition, and AI-powered speaking practice.

## Architecture

```
┌─────────────────────────────────────────────────┐
│               Monorepo Structure                │
│                                                 │
│  /  (root)          → Next.js 16 Frontend       │
│  /backend           → NestJS 10 Backend (API)   │
│                                                 │
│  Frontend  → port 3000   (Vercel in prod)       │
│  Backend   → port 3001   (Docker / GHCR)        │
└─────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | NestJS 10, Passport.js, JWT (HttpOnly Cookie) |
| **Database** | PostgreSQL via Prisma 7 (ORM) |
| **Auth** | Google OAuth 2.0 → JWT HttpOnly Cookie |
| **AI** | Anthropic Claude (streaming) |
| **Spaced Repetition** | FSRS-5 algorithm (implemented in backend) |
| **CI/CD** | GitHub Actions → GHCR (backend) + Vercel (frontend) |

---

## Project Structure

```
learning-english-ielts/
├── app/                        # Next.js App Router (pages & layouts)
│   ├── (auth)/                 # Login & OAuth callback pages
│   └── (main)/                 # Authenticated app shell
│       ├── dictation/          # Video dictation practice
│       ├── speaking/           # AI speaking practice
│       ├── vocabulary/         # FSRS flashcard review
│       ├── word-lists/         # Saved vocabulary list
│       ├── my-videos/          # Video management
│       ├── shadowing/          # Shadowing practice
│       └── stats/              # Learning statistics
├── backend/                    # NestJS REST API
│   ├── src/
│   │   ├── auth/               # Google OAuth + JWT strategy
│   │   ├── users/              # User CRUD
│   │   ├── videos/             # YouTube import & video management
│   │   ├── transcript/         # YouTube subtitle fetching
│   │   ├── progress/           # Dictation progress tracking
│   │   ├── words/              # Notes, Cards & FSRS-5 scheduling
│   │   └── speaking/           # Anthropic AI streaming
│   └── prisma/                 # Backend schema (all models)
├── components/                 # Shared React components
├── lib/
│   └── api-client.ts           # Centralised HTTP client (→ backend)
├── prisma/                     # Shared Prisma schema (reference)
├── .github/workflows/          # CI/CD pipelines
│   ├── docker-backend.yml      # Build & push backend image to GHCR
│   └── vercel-frontend.yml     # Deploy frontend to Vercel
├── docker-compose.yml          # Local full-stack orchestration
└── Dockerfile                  # Frontend production image
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL database (or a connection string from Supabase / Neon / Railway)
- Google OAuth Client (see setup below)
- Anthropic API Key (for speaking feature)

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/learning-english-ielts.git
cd learning-english-ielts

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Set Up Environment Variables

**Frontend** — create `.env.local` in project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** — create `backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/bap_english
DIRECT_URL=postgresql://user:pass@localhost:5432/bap_english

JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRY=7d

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3000

ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3001/auth/google/callback
   ```

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Start Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Backend (NestJS on :3001)
npm run dev:backend

# Terminal 2 — Frontend (Next.js on :3000)
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Auth Flow

```
Browser → http://localhost:3001/auth/google
       → Google consent screen
       → http://localhost:3001/auth/google/callback
       → NestJS sets HttpOnly cookie "access_token"
       → Redirect to http://localhost:3000/callback
       → Frontend reads token → redirect to /dictation
```

---

## API Endpoints (Backend — port 3001)

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/google` | Start Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback (sets cookie) |
| `GET` | `/auth/me` | Current user profile |
| `GET` | `/auth/logout` | Clear auth cookie |
| `GET` | `/videos` | List all videos |
| `GET` | `/videos/:id` | Get video with sentences |
| `POST` | `/videos/import` | Import YouTube video |
| `DELETE` | `/videos/:id` | Delete a video |
| `GET` | `/transcript` | Fetch YouTube subtitles |
| `GET` | `/progress` | Get all dictation progress |
| `POST` | `/progress` | Upsert dictation progress |
| `GET` | `/words` | List all saved notes |
| `POST` | `/words` | Save a word/note |
| `DELETE` | `/words` | Delete a word/note |
| `POST` | `/words/review` | Submit FSRS card review |
| `POST` | `/speaking` | Stream AI speaking response |

---

## Docker (Local Full Stack)

```bash
# Copy and fill in your secrets
cp .env.example .env
# Edit .env with your actual values

# Build and start all services
docker compose up --build -d

# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
```

---

## CI/CD Pipeline

### Backend — GitHub Container Registry

On every push to `main` touching `backend/**`:
1. GitHub Actions builds `backend/Dockerfile`
2. Pushes image to `ghcr.io/<owner>/bap-english-backend:latest`

**Required GitHub Secrets:** None (uses automatic `GITHUB_TOKEN`)

### Frontend — Vercel

On every push to `main` touching frontend files:
1. GitHub Actions runs `vercel build --prod`
2. Deploys prebuilt output to Vercel production

**Required GitHub Secrets:**

| Secret | How to get |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Run `vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Run `vercel link` → `.vercel/project.json` |

**Vercel Environment Variables** (set in Vercel dashboard):
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Production Deployment

### Backend Options
After the Docker image is built and pushed to GHCR, pull it to any container host:

```bash
docker pull ghcr.io/<owner>/bap-english-backend:latest
```

Recommended platforms: **Railway**, **Render**, **Fly.io**, **VPS with Docker**

### Frontend
Vercel auto-deploys on every push to `main` via GitHub Actions.

**Environment variable to set on Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-backend-production-url.com
```

**Google OAuth — Update redirect URI for production:**
```
https://your-backend-production-url.com/auth/google/callback
```

---

## Available Scripts

### Root (Frontend)
```bash
npm run dev           # Start Next.js dev server (:3000)
npm run dev:backend   # Start NestJS dev server (:3001)
npm run build         # Build Next.js for production
npm run build:backend # Build NestJS for production
npm run build:all     # Build backend then frontend
npm run lint          # ESLint
npm run test          # Run unit tests (vitest)
npm run test:e2e      # Run E2E tests (Playwright)
```

### Backend (`cd backend`)
```bash
npm run start:dev       # NestJS with hot reload
npm run build           # Compile TypeScript
npm run prisma:generate # Regenerate Prisma client
npm run prisma:migrate  # Run DB migrations (dev)
npm run prisma:studio   # Open Prisma Studio
npm test                # Run Jest tests
```
