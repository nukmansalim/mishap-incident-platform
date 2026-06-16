-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('client', 'project', 'department');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'client',
    "status" "ClientStatus" NOT NULL DEFAULT 'active',
    "description" TEXT,
    "primary_contact_name" TEXT,
    "primary_contact_email" TEXT,
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_organization_id_status_idx" ON "clients"("organization_id", "status");

-- CreateIndex
CREATE INDEX "clients_organization_id_type_idx" ON "clients"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organization_id_slug_key" ON "clients"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organization_id_name_key" ON "clients"("organization_id", "name");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
