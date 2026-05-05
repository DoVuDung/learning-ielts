-- Drop old unique constraint on youtubeId alone
DROP INDEX IF EXISTS "Video_youtubeId_key";

-- Add composite unique constraint per user
ALTER TABLE "Video" ADD CONSTRAINT "Video_youtubeId_createdById_key" UNIQUE ("youtubeId", "createdById");
