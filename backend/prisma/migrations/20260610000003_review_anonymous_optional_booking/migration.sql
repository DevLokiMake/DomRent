-- Add anonymous field and make bookingId optional
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "anonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ALTER COLUMN "bookingId" DROP NOT NULL;

-- Drop old unique constraint on authorId+bookingId (bookingId can now be NULL)
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_authorId_bookingId_key";
