-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hashedRefreshToken" TEXT,
ADD COLUMN     "refreshTokenExp" TIMESTAMP(3);
