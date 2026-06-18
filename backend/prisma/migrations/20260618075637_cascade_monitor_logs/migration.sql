-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "MonitorCheckLog" DROP CONSTRAINT "MonitorCheckLog_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "MonitorEvent" DROP CONSTRAINT "MonitorEvent_monitorId_fkey";

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorEvent" ADD CONSTRAINT "MonitorEvent_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorCheckLog" ADD CONSTRAINT "MonitorCheckLog_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
