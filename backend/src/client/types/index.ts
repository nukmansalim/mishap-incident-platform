import { Client, ClientStatus, ClientType, Prisma } from "generated/prisma/client";
export type ClientListParams = {
    status?: ClientStatus;
    type?: ClientType;
    search?: string;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
};

export type CreateClientRecordInput = {
    organizationId: string;
    name: string;
    slug: string;
    type?: ClientType;
    status?: ClientStatus;
    description?: string | null;
    primaryContactName?: string | null;
    primaryContactEmail?: string | null;
    metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    createdById?: string | null;
};

export type UpdateClientRecordInput = {
    name?: string;
    slug?: string;
    type?: ClientType;
    status?: ClientStatus;
    description?: string | null;
    primaryContactName?: string | null;
    primaryContactEmail?: string | null;
    metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};