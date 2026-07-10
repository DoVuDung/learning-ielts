# BapEnglish — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **BapEnglish** platform to production using the decoupled architecture:
- **Frontend**: Next.js 16 deployed on **Vercel**
- **Backend**: NestJS 10 Docker container deployed on **Railway / Render / VPS**
- **Database**: PostgreSQL on **Supabase / Neon / Railway Postgres**

---

## Architecture Overview

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│      Frontend (Next.js)        │       │       Backend (NestJS)         │
│     Deployed on Vercel         │       │    Docker Image from GHCR      │
│  https://bap-english.vercel.app│◄─────►│    https://api.bap-english.com │
└────────────────────────────────┘       └───────────────┬────────────────┘
                                                         │
                                                         ▼
                                         ┌────────────────────────────────┐
                                         │     PostgreSQL Database        │
                                         │    Supabase / Neon / Railway   │
                                         └────────────────────────────────┘
```

---

## Phase 1: Set Up PostgreSQL Database

1. Create a managed PostgreSQL instance using one of these providers:
   - **[Supabase](https://supabase.com)** (Recommended - generous free tier)
   - **[Neon.tech](https://neon.tech)** (Serverless Postgres)
   - **[Railway Postgres](https://railway.app)**
2. Copy your PostgreSQL connection strings:
   - **Transaction / Connection Pooled URL**: `DATABASE_URL`
   - **Direct URL (for Prisma migrations)**: `DIRECT_URL`

---

## Phase 2: Deploy Backend (NestJS API)

The backend is packaged as a Docker container automatically built and published to **GitHub Container Registry (GHCR)** via GitHub Actions (`docker-backend.yml`).

### Option A: Deploy to Railway (Recommended)

1. Go to [Railway.app](https://railway.app) → **New Project** → **Deploy from Docker Image**.
2. Enter your GHCR image path:
   ```text
   ghcr.io/<your-github-username>/bap-english-backend:latest
   ```
3. Under **Variables**, add the required environment variables:

   | Variable | Example Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode & secure cookies |
   | `PORT` | `3001` | Server port |
   | `DATABASE_URL` | `postgresql://...` | Connection pooled database URL |
   | `DIRECT_URL` | `postgresql://...` | Direct database URL |
   | `JWT_SECRET` | `long-random-string-min-32-chars` | Secret key for signing JWT cookies |
   | `JWT_EXPIRY` | `7d` | Token expiration duration |
   | `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google OAuth Secret |
   | `GOOGLE_CALLBACK_URL` | `https://api.bap-english.com/auth/google/callback` | Must point to your live backend domain |
   | `FRONTEND_URL` | `https://bap-english.vercel.app` | Exact live frontend URL (for CORS & redirect) |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic Claude API Key |

4. Under **Settings** → **Networking**, generate a public domain (e.g., `https://api.bap-english.com` or `https://backend-xxx.up.railway.app`).
5. **Run Migrations**: Railway automatically runs `npx prisma migrate deploy` on startup as defined in `backend/Dockerfile`.

---

### Option B: Deploy to VPS (Docker / Docker Compose)

Create a `.env` file on your server and run:

```bash
docker run -d \
  --name bap-backend \
  --restart always \
  -p 3001:3001 \
  --env-file .env \
  ghcr.io/<your-github-username>/bap-english-backend:latest
```

---

## Phase 3: Deploy Frontend (Next.js UI) to Vercel

### Method 1: Vercel Git Integration (Easiest)
1. Go to [Vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repository.
2. In **Environment Variables**, add:

   | Variable | Example Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://api.bap-english.com` | Live URL of your deployed NestJS backend |

3. Click **Deploy**. Vercel will build and deploy immediately.

### Method 2: GitHub Actions Workflow (`vercel-frontend.yml`)
If you prefer automated deployments through GitHub Actions:
1. Link your local project to Vercel:
   ```bash
   npx vercel link
   ```
2. Open `.vercel/project.json` and copy `orgId` and `projectId`.
3. In your GitHub Repository → **Settings** → **Secrets and variables** → **Actions**, add:
   - `VERCEL_TOKEN`: Personal Access Token from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: Your `orgId`
   - `VERCEL_PROJECT_ID`: Your `projectId`
4. Push to `main` branch to trigger automatic deployment.

---

## Phase 4: Configure Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript origins**, add:
   - `https://bap-english.vercel.app` (Your live frontend URL)
   - `https://api.bap-english.com` (Your live backend URL)
4. Under **Authorized redirect URIs**, add your live backend callback URL:
   - `https://api.bap-english.com/auth/google/callback`
5. Save changes.

---

## Monorepo Build Separation (FE vs BE)

To prevent Vercel from wasting build minutes when you only update the NestJS backend, and to ensure each service deploys independently:

### 1. Frontend (Vercel Ignore Command)
We have configured [`vercel.json`](file:///Users/andydo/Desktop/learning-english-ielts/vercel.json) in the project root with an automatic ignore script:
```json
{
  "ignoreCommand": "bash scripts/vercel-ignore-step.sh"
}
```
- **How it works**: Before Vercel builds, it executes [`scripts/vercel-ignore-step.sh`](file:///Users/andydo/Desktop/learning-english-ielts/scripts/vercel-ignore-step.sh).
- If only files inside `backend/` or `.github/workflows/docker-backend.yml` were changed, the script exits with `code 0` ➔ **Vercel skips the build automatically**.
- If any frontend file (`app/`, `components/`, `lib/`, `package.json`, etc.) changed, the script exits with `code 1` ➔ **Vercel proceeds to build Next.js**.

### 2. Backend (GitHub Actions Path Trigger)
The backend CI pipeline ([`.github/workflows/docker-backend.yml`](file:///Users/andydo/Desktop/learning-english-ielts/.github/workflows/docker-backend.yml)) only triggers when files inside `backend/**` change:
```yaml
on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/docker-backend.yml"
```
This guarantees complete separation:
- Push changing only `backend/` ➔ **Only GHCR Docker builds** (Vercel skips).
- Push changing only `app/` ➔ **Only Vercel builds** (GHCR Docker skips).

---

## Verification Checklist

After deployment, test the following end-to-end flows:

- [ ] **Health Check & Docs**: Visit `https://api.bap-english.com/api/docs` to verify Swagger UI loads.
- [ ] **Google OAuth Flow**:
  1. Click Login on frontend (`https://bap-english.vercel.app/login`).
  2. Browser redirects to Google Consent screen via Backend.
  3. Successfully returns to Frontend `/dictation` page logged in.
- [ ] **CORS & Secure Cookies**:
  - Open DevTools → Application → Cookies → Verify `access_token` cookie has `HttpOnly`, `Secure`, and `SameSite=Lax` flags.
- [ ] **AI Speaking**: Test streaming chat on `/speaking` to ensure chunked Transfer-Encoding works behind your reverse proxy.
