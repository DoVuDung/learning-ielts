-- CreateEnum
CREATE TYPE "CardState" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING');

-- CreateEnum
CREATE TYPE "CardTemplate" AS ENUM ('WORD_TO_MEANING', 'MEANING_TO_WORD', 'LISTENING');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT,
    "context" TEXT,
    "videoId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" "CardTemplate" NOT NULL DEFAULT 'WORD_TO_MEANING',
    "state" "CardState" NOT NULL DEFAULT 'NEW',
    "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "elapsedDays" INTEGER NOT NULL DEFAULT 0,
    "scheduledDays" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "state" "CardState" NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "elapsedDays" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_userId_word_key" ON "Note"("userId", "word");

-- CreateIndex
CREATE INDEX "Card_userId_due_idx" ON "Card"("userId", "due");

-- CreateIndex
CREATE INDEX "Card_userId_state_idx" ON "Card"("userId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Card_noteId_template_key" ON "Card"("noteId", "template");

-- CreateIndex
CREATE INDEX "ReviewLog_cardId_reviewedAt_idx" ON "ReviewLog"("cardId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill Notes from SavedWord
INSERT INTO "Note" ("id", "userId", "word", "context", "videoId", "createdAt")
SELECT "id", "userId", "word", "context", "videoId", "createdAt"
FROM "SavedWord";

-- Backfill Cards from SavedWord (one WORD_TO_MEANING card per saved word, REVIEW state)
INSERT INTO "Card" (
    "id", "noteId", "userId", "template", "state",
    "due", "stability", "difficulty",
    "elapsedDays", "scheduledDays", "reps", "lapses",
    "lastReview", "createdAt"
)
SELECT
    'card_' || "id",
    "id",
    "userId",
    'WORD_TO_MEANING'::"CardTemplate",
    'REVIEW'::"CardState",
    "nextReview",
    GREATEST("interval"::DOUBLE PRECISION, 1.0),
    5.0,
    "interval",
    "interval",
    1,
    0,
    NULL,
    "createdAt"
FROM "SavedWord";

-- DropTable
DROP TABLE "SavedWord";
