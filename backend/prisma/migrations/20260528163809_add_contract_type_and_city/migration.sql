/*
  Warnings:

  - You are about to drop the column `city` on the `Property` table. All the data in the column will be lost.
  - Added the required column `cityId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('RENT', 'SALE');

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- Insert existing cities from Property table into City table
INSERT INTO "City" ("name", "createdAt")
SELECT DISTINCT "city", NOW() FROM "Property"
ON CONFLICT ("name") DO NOTHING;

-- AlterTable - Add temporary column for cityId
ALTER TABLE "Property" 
ADD COLUMN "contractType" "ContractType" NOT NULL DEFAULT 'RENT',
ADD COLUMN "cityId" INTEGER;

-- Update cityId based on existing city names
UPDATE "Property" p
SET "cityId" = c."id"
FROM "City" c
WHERE p."city" = c."name";

-- Make cityId NOT NULL
ALTER TABLE "Property" ALTER COLUMN "cityId" SET NOT NULL;

-- Drop old city column
ALTER TABLE "Property" DROP COLUMN "city";

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
