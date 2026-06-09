-- Add avatar field to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"         SERIAL NOT NULL,
    "adminId"    INTEGER NOT NULL,
    "action"     TEXT NOT NULL,
    "targetId"   INTEGER,
    "targetType" TEXT,
    "details"    JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign key
ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
