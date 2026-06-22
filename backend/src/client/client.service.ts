import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto, ListClientsDto } from './dto';
import { OrganizationRepository } from '../organization/organization.repository';

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async create(orgId: string, actorUserId: string, dto: CreateClientDto) {
    await this.assertOrganizationExists(orgId);

    const normalizedName = dto.name.trim();
    const slug = this.buildSlug(normalizedName);

    const [nameExists, slugExists] = await Promise.all([
      this.clientRepository.existsByName(orgId, normalizedName),
      this.clientRepository.existsBySlug(orgId, slug),
    ]);

    if (nameExists) {
      throw new ConflictException(
        'Client name already exists in this organization',
      );
    }

    if (slugExists) {
      throw new ConflictException(
        'Client slug already exists in this organization',
      );
    }

    return this.clientRepository.create({
      organizationId: orgId,
      name: normalizedName,
      slug,
      type: dto.type,
      status: dto.status,
      description: dto.description?.trim() ?? null,
      primaryContactName: dto.primaryContactName?.trim() ?? null,
      primaryContactEmail:
        dto.primaryContactEmail?.trim().toLowerCase() ?? null,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      createdById: actorUserId,
    });
  }

  async findAll(orgId: string, query: ListClientsDto) {
    await this.assertOrganizationExists(orgId);

    const [items, total] = await Promise.all([
      this.clientRepository.findManyByOrg(orgId, {
        status: query.status,
        type: query.type,
        search: query.search?.trim(),
        skip: query.skip,
        take: query.take,
      }),
      this.clientRepository.countByOrganization(orgId, {
        status: query.status,
        type: query.type,
        search: query.search?.trim(),
      }),
    ]);

    return {
      items,
      meta: {
        total,
        skip: query.skip ?? 0,
        take: query.take ?? 20,
      },
    };
  }

  async findById(orgId: string, clientId: string) {
    const client = await this.clientRepository.findById(orgId, clientId);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(orgId: string, clientId: string, dto: UpdateClientDto) {
    const existing = await this.clientRepository.findById(orgId, clientId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const nextName = dto.name !== undefined ? dto.name.trim() : existing.name;

    const nextSlug =
      dto.name !== undefined ? this.buildSlug(dto.name.trim()) : existing.slug;

    if (dto.name !== undefined && dto.name.trim() !== existing.name) {
      const nameExists = await this.clientRepository.existsByName(
        orgId,
        nextName,
        clientId,
      );

      if (nameExists) {
        throw new ConflictException(
          'Client name already exists in this organization',
        );
      }
    }

    if (nextSlug !== existing.slug) {
      const slugExists = await this.clientRepository.existsBySlug(
        orgId,
        nextSlug,
        clientId,
      );

      if (slugExists) {
        throw new ConflictException(
          'Client slug already exists in this organization',
        );
      }
    }

    return this.clientRepository.update(orgId, clientId, {
      ...(dto.name !== undefined ? { name: nextName, slug: nextSlug } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
      ...(dto.primaryContactName !== undefined
        ? { primaryContactName: dto.primaryContactName?.trim() || null }
        : {}),
      ...(dto.primaryContactEmail !== undefined
        ? {
            primaryContactEmail:
              dto.primaryContactEmail?.trim().toLowerCase() || null,
          }
        : {}),
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    });
  }

  async archive(orgId: string, clientId: string) {
    const existing = await this.clientRepository.findById(orgId, clientId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    return this.clientRepository.archive(orgId, clientId);
  }

  async restore(orgId: string, clientId: string) {
    const existing = await this.clientRepository.findById(orgId, clientId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    return this.clientRepository.restore(orgId, clientId);
  }

  private async assertOrganizationExists(orgId: string) {
    const organization =
      await this.organizationRepository.findOrgByOrgId(orgId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private buildSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
