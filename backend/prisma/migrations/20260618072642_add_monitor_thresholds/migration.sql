-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "failureThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "latencyBreachThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "latencyCriticalMs" INTEGER,
ADD COLUMN     "latencyWarningMs" INTEGER,
ADD COLUMN     "sslCriticalDays" INTEGER,
ADD COLUMN     "sslWarningDays" INTEGER;
