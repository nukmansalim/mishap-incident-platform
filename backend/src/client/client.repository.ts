import { Injectable } from "@nestjs/common";
import { ClientListParams, CreateClientRecordInput, UpdateClientRecordInput } from "./types";
import { PrismaService } from "src/prisma/prisma.service";
import { Client } from "generated/prisma/client";

@Injectable()
export class ClientRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateClientRecordInput): Promise<Client> {
        return this.prisma.client.create({
            data: {
                organizationId: data.organizationId,
                name: data.name,
                slug: data.slug,
                type: data.type,
                status: data.status,
                description: data.description,
                primaryContactName: data.primaryContactName,
                primaryContactEmail: data.primaryContactEmail,
                metadata: data.metadata,
                createdById: data.createdById,
            }
        })
    }
    async findManyByOrg(orgId: string, params: ClientListParams = {}): Promise<Client[]> {
        const { status, type, search, skip = 0, take = 20, orderBy } = params;

        return this.prisma.client.findMany({
            where: {
                organizationId: orgId,
                ...(status ? { status } : {}),
                ...(type ? { type } : {}),
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { slug: { contains: search, mode: 'insensitive' } },
                            { primaryContactEmail: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            skip,
            take,
            orderBy: orderBy ?? { createdAt: 'desc' },
        });
    }
    async countByOrganization(
        organizationId: string,
        params: Omit<ClientListParams, 'skip' | 'take' | 'orderBy'> = {},
    ): Promise<number> {
        const { status, type, search } = params;

        return this.prisma.client.count({
            where: {
                organizationId,
                ...(status ? { status } : {}),
                ...(type ? { type } : {}),
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { slug: { contains: search, mode: 'insensitive' } },
                            { primaryContactEmail: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
        });
    }

    async findById(
        organizationId: string,
        clientId: string,
    ): Promise<Client | null> {
        return this.prisma.client.findFirst({
            where: {
                id: clientId,
                organizationId,
            },
        });
    }

    async findBySlug(
        organizationId: string,
        slug: string,
    ): Promise<Client | null> {
        return this.prisma.client.findFirst({
            where: {
                organizationId,
                slug,
            },
        });
    }

    async findByName(
        organizationId: string,
        name: string,
    ): Promise<Client | null> {
        return this.prisma.client.findFirst({
            where: {
                organizationId,
                name,
            },
        });
    }

    async existsBySlug(
        organizationId: string,
        slug: string,
        excludeClientId?: string,
    ): Promise<boolean> {
        const count = await this.prisma.client.count({
            where: {
                organizationId,
                slug,
                ...(excludeClientId
                    ? {
                        NOT: { id: excludeClientId },
                    }
                    : {}),
            },
        });

        return count > 0;
    }

    async existsByName(
        organizationId: string,
        name: string,
        excludeClientId?: string,
    ): Promise<boolean> {
        const count = await this.prisma.client.count({
            where: {
                organizationId,
                name,
                ...(excludeClientId
                    ? {
                        NOT: { id: excludeClientId },
                    }
                    : {}),
            },
        });

        return count > 0;
    }

    async update(
        organizationId: string,
        clientId: string,
        data: UpdateClientRecordInput,
    ): Promise<Client> {
        return this.prisma.client.update({
            where: {
                id: clientId,
            },
            data,
        });
    }

    async archive(
        organizationId: string,
        clientId: string,
    ): Promise<Client> {
        return this.prisma.client.update({
            where: {
                id: clientId,
            },
            data: {
                status: 'archived',
            },
        });
    }

    async restore(
        organizationId: string,
        clientId: string,
    ): Promise<Client> {
        return this.prisma.client.update({
            where: {
                id: clientId,
            },
            data: {
                status: 'active',
            },
        });
    }
}