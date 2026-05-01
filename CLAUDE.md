# Senglish – IELTS Learning App

@AGENTS.md

A pixel-perfect clone of the Senglish dictation learning platform, built with Next.js 16, Tailwind CSS v4, and shadcn/ui (nova preset).

## Stack

- **Framework**: Next.js 16 App Router (TypeScript, RSC by default)
- **Styling**: Tailwind CSS v4 with `@theme inline` — no `tailwind.config.js`
- **UI components**: shadcn/ui (`nova` preset, `radix` base, `lucide-react` icons)
- **Font**: Inter (via `next/font/google`, mapped to `--font-sans`)
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

## Component Conventions

- All interactive components using `useState`/`useEffect`/events need `"use client"` at the top.
- Server components (pages, grids, data layouts) have no directive — RSC by default.
- Props interfaces use `Readonly<{...}>`.
- Explicit typed interfaces live in the file that uses them — avoid a shared `types/` file unless shared across 3+ components.

## File Layout

```text
app/
  globals.css       ← single source of CSS variables + Tailwind imports
  layout.tsx        ← Inter font; bg-background / text-foreground on body
  page.tsx          ← DictationPage (RSC) — composes all sections

components/
  side-nav.tsx      ← "use client" — active link detection via usePathname
  top-nav.tsx       ← "use client" — sticky header with lesson stats
  filter-bar.tsx    ← "use client" — horizontal category + level filter chips
  video-card.tsx    ← RSC — thumbnail card, level badge, duration pill
  lesson-grid.tsx   ← RSC — section header + responsive grid of VideoCards

components/ui/      ← shadcn/ui source files (do not edit directly)
```

## Image Domains

Whitelisted in `next.config.ts`: `i.ytimg.com` (YouTube thumbnails) and `api.dicebear.com` (avatars).

## Styling Rules

- `cn()` from `@/lib/utils` for conditional classes.
- `size-*` for square elements, never `w-* h-*`.
- `gap-*` for spacing, never `space-x-*` / `space-y-*`.
- `truncate` shorthand over the three-property expansion.
- Semantic tokens only (`bg-card`, `text-muted-foreground`) — never raw hex or Tailwind color scales like `bg-zinc-800`.

## Running

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npx tsc --noEmit # type-check only
```
