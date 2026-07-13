#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Vercel Ignore Build Step Script for BapEnglish Monorepo
#
# Rules in Vercel:
#   Exit code 0 ➔ SKIP BUILD (Do not build on Vercel)
#   Exit code 1 ➔ PROCEED BUILD (Build Next.js Frontend)
# ─────────────────────────────────────────────────────────────────────────────

echo "🔍 Checking if commit modified Frontend files..."

# Determine commit range to check
PREV_SHA=${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}
CURR_SHA=${VERCEL_GIT_COMMIT_SHA:-HEAD}

echo "Comparing changes between $PREV_SHA and $CURR_SHA"

# Check if any frontend-related directory/file changed
if git diff --quiet "$PREV_SHA" "$CURR_SHA" -- \
  app/ \
  components/ \
  lib/ \
  public/ \
  prisma/ \
  package.json \
  package-lock.json \
  next.config.ts \
  postcss.config.mjs \
  tailwind.config.ts \
  tsconfig.json \
  proxy.ts \
  vercel.json; then
  echo "🛑 No Frontend files modified. SKIPPING Vercel build (Exit code 0)."
  exit 0
else
  echo "✅ Frontend files modified. PROCEEDING with Vercel build (Exit code 1)."
  exit 1
fi
