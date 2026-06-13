/*
  Warnings:

  - You are about to drop the column `slug` on the `organizations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "organizations_slug_key";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "slug",
ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'active';
