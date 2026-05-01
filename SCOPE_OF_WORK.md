# Scope of Work – Senglish Sidebar Routing

## Overview

Implement full client-side routing for all sidebar navigation items in the Senglish IELTS learning app. Every link in the sidebar must navigate to a real, styled page. Active state in the sidebar must reflect the current URL automatically.

---

## Deliverables

### 1. Route Architecture Refactor

**Goal:** Centralise the shell layout (sidebar + wrapper) in a single Next.js route group so no page duplicates the shell markup.

| Item | Description |
| --- | --- |
| `app/(main)/layout.tsx` | Shared shell layout: renders `<SideNav>` + content wrapper for all routes inside the group |
| `app/page.tsx` | Root entry point — immediately redirects to `/dictation` |
| Route group `(main)` | Transparent URL group; does not affect public paths |

### 2. Sidebar Active-State Fix

**Goal:** Active highlight must be driven by `usePathname()` only — no hardcoded `active` flag.

- Remove `active: true` from the Dictation nav item in `side-nav.tsx`
- `isActive` logic: `pathname === item.href` (already in place via `usePathname`)
- Result: whichever route is loaded, the correct sidebar item highlights automatically

### 3. TopNav Generalisation

**Goal:** `TopNav` must accept a dynamic title and optional subtitle per page instead of hardcoded strings.

| Prop | Type | Purpose |
| --- | --- | --- |
| `title` | `string` | Page heading (e.g. "Luyện Dictation") |
| `subtitle` | `string?` | Subheading below the title |
| `showStats` | `boolean?` | Show the stats bar (learning count, accuracy %) — only Dictation uses this |

### 4. Pages Implemented

| Route | File | Status |
| --- | --- | --- |
| `/dictation` | `app/(main)/dictation/page.tsx` | Full — lesson grid, filter bar, stats |
| `/shadowing` | `app/(main)/shadowing/page.tsx` | Placeholder — coming soon card |
| `/speaking` | `app/(main)/speaking/page.tsx` | Placeholder — coming soon card |
| `/vocabulary` | `app/(main)/vocabulary/page.tsx` | Placeholder — coming soon card |
| `/my-videos` | `app/(main)/my-videos/page.tsx` | Placeholder — empty state card |
| `/word-lists` | `app/(main)/word-lists/page.tsx` | Placeholder — empty state card |
| `/dictionary` | `app/(main)/dictionary/page.tsx` | Placeholder — coming soon card |
| `/leaderboard` | `app/(main)/leaderboard/page.tsx` | Placeholder — coming soon card |
| `/stats` | `app/(main)/stats/page.tsx` | Placeholder — coming soon card |

### 5. Shared `ComingSoon` Component

**File:** `components/coming-soon.tsx`

Reusable RSC used by all placeholder pages. Renders a centred card with:
- A large icon in a pink-tinted rounded square
- Title + description in Vietnamese
- A "Sắp ra mắt" (Coming soon) badge styled with the primary accent colour

**Props:**

| Prop | Type |
| --- | --- |
| `icon` | `LucideIcon` |
| `title` | `string` |
| `description` | `string` |

---

## Out of Scope (this iteration)

- Actual feature implementation for Shadowing, Speaking, Vocabulary, etc.
- Authentication / user session
- API integration or real lesson data
- Search functionality
- Lesson detail / player page (`/dictation/[id]`)
- Category sub-routes (`/category/bbc`, `/category/ielts`)

---

## File Tree After This Work

```text
app/
  layout.tsx                    ← root (Inter font, globals) — unchanged
  page.tsx                      ← redirect("/dictation")
  (main)/
    layout.tsx                  ← SideNav shell shared by all child routes
    dictation/
      page.tsx                  ← full dictation browser (TopNav + FilterBar + LessonGrid)
    shadowing/page.tsx
    speaking/page.tsx
    vocabulary/page.tsx
    my-videos/page.tsx
    word-lists/page.tsx
    dictionary/page.tsx
    leaderboard/page.tsx
    stats/page.tsx

components/
  coming-soon.tsx               ← NEW: shared placeholder card
  side-nav.tsx                  ← UPDATED: removed hardcoded active flag
  top-nav.tsx                   ← UPDATED: title/subtitle/showStats props
  filter-bar.tsx                ← unchanged
  video-card.tsx                ← unchanged
  lesson-grid.tsx               ← unchanged
```

---

## Definition of Done

- [ ] `/ ` redirects to `/dictation` in the browser
- [ ] Navigating to any sidebar link loads the correct page without a full reload
- [ ] Active sidebar item highlights match the current URL exactly
- [ ] No TypeScript errors (`npx tsc --noEmit` exits 0)
- [ ] The shell (sidebar) never duplicates across page files
