/*
  Warnings:

  - You are about to drop the column `monitorId` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_monitorId_fkey";

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "successThreshold" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "monitorId";

-- CreateTable
CREATE TABLE "_ClientToMonitoredService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientToMonitoredService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientToMonitoredService_B_index" ON "_ClientToMonitoredService"("B");

-- AddForeignKey
ALTER TABLE "_ClientToMonitoredService" ADD CONSTRAINT "_ClientToMonitoredService_A_fkey" FOREIGN KEY ("A") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToMonitoredService" ADD CONSTRAINT "_ClientToMonitoredService_B_fkey" FOREIGN KEY ("B") REFERENCES "MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
