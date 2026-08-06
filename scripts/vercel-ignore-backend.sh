#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Vercel Ignore Build Step Script for BapEnglish Backend
#
# Rules in Vercel:
#   Exit code 0 ➔ SKIP BUILD (Do not build on Vercel)
#   Exit code 1 ➔ PROCEED BUILD (Build NestJS Backend)
# ─────────────────────────────────────────────────────────────────────────────

echo "🔍 Checking if commit modified Backend files..."

# Determine commit range to check
PREV_SHA=${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}
CURR_SHA=${VERCEL_GIT_COMMIT_SHA:-HEAD}

echo "Comparing changes between $PREV_SHA and $CURR_SHA"

# Check if any backend-related directory/file changed
if git diff --quiet "$PREV_SHA" "$CURR_SHA" -- \
  backend/ \
  prisma/ \
  package.json \
  package-lock.json; then
  echo "🛑 No Backend files modified. SKIPPING Vercel build (Exit code 0)."
  exit 0
else
  echo "✅ Backend files modified. PROCEEDING with Vercel build (Exit code 1)."
  exit 1
fi
