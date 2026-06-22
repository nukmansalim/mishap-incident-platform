-- CreateEnum
CREATE TYPE "EscalationTargetType" AS ENUM ('USER', 'TEAM_ROLE', 'ORG_ROLE');

-- CreateEnum
CREATE TYPE "AlertDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "escalation_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_alerted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "escalation_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "monitored_service_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_steps" (
    "id" TEXT NOT NULL,
    "escalation_policy_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "delay_minutes" INTEGER NOT NULL,
    "target_type" "EscalationTargetType" NOT NULL,
    "user_id" TEXT,
    "team_role" "TeamRole",
    "organization_role" "OrganizationRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_alerts" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "escalation_step_id" TEXT,
    "level" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient_user_id" TEXT,
    "recipient_address" TEXT,
    "delivery_status" "AlertDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escalation_policies_monitored_service_id_key" ON "escalation_policies"("monitored_service_id");

-- CreateIndex
CREATE INDEX "escalation_policies_organization_id_idx" ON "escalation_policies"("organization_id");

-- CreateIndex
CREATE INDEX "escalation_steps_escalation_policy_id_idx" ON "escalation_steps"("escalation_policy_id");

-- CreateIndex
CREATE INDEX "escalation_steps_user_id_idx" ON "escalation_steps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_steps_escalation_policy_id_level_key" ON "escalation_steps"("escalation_policy_id", "level");

-- CreateIndex
CREATE INDEX "incident_alerts_incident_id_level_idx" ON "incident_alerts"("incident_id", "level");

-- CreateIndex
CREATE INDEX "incident_alerts_recipient_user_id_idx" ON "incident_alerts"("recipient_user_id");

-- AddForeignKey
ALTER TABLE "escalation_policies" ADD CONSTRAINT "escalation_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_policies" ADD CONSTRAINT "escalation_policies_monitored_service_id_fkey" FOREIGN KEY ("monitored_service_id") REFERENCES "MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_steps" ADD CONSTRAINT "escalation_steps_escalation_policy_id_fkey" FOREIGN KEY ("escalation_policy_id") REFERENCES "escalation_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_steps" ADD CONSTRAINT "escalation_steps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_alerts" ADD CONSTRAINT "incident_alerts_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_alerts" ADD CONSTRAINT "incident_alerts_escalation_step_id_fkey" FOREIGN KEY ("escalation_step_id") REFERENCES "escalation_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_alerts" ADD CONSTRAINT "incident_alerts_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
