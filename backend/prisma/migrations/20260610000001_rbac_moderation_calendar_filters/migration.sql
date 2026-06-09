-- ============================================================
-- Migration: RBAC + Moderation + Calendar + Filters
-- ============================================================

-- 1. Add ADMIN value to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- 2. Add ModerationStatus enum
DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Add PROPERTY_APPROVED / PROPERTY_REJECTED to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROPERTY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROPERTY_REJECTED';

-- 4. Add isBanned to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- 5. Add moderation, amenity, and rooms fields to Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "rooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "hasWifi" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "hasParking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "petsAllowed" BOOLEAN NOT NULL DEFAULT false;

-- 6. Auto-approve existing properties so they stay visible
UPDATE "Property" SET "status" = 'APPROVED' WHERE "status" = 'PENDING';

-- 7. Create BlockedDate table
CREATE TABLE IF NOT EXISTS "BlockedDate" (
  "id"         SERIAL       NOT NULL,
  "propertyId" INTEGER      NOT NULL,
  "date"       DATE         NOT NULL,
  "reason"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- 8. Foreign key: BlockedDate -> Property
DO $$ BEGIN
  ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Unique constraint: one blocked-date record per property per day
CREATE UNIQUE INDEX IF NOT EXISTS "BlockedDate_propertyId_date_key"
  ON "BlockedDate"("propertyId", "date");

-- 10. Index for fast lookup
CREATE INDEX IF NOT EXISTS "BlockedDate_propertyId_idx"
  ON "BlockedDate"("propertyId");

-- 11. Index for moderation status filtering
CREATE INDEX IF NOT EXISTS "Property_status_idx"
  ON "Property"("status");
