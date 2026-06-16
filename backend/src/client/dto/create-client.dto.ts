import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { ClientType, ClientStatus } from 'generated/prisma/enums';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @IsOptional()
    @IsEnum(ClientType)
    type?: ClientType;

    @IsOptional()
    @IsEnum(ClientStatus)
    status?: ClientStatus;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    primaryContactName?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    primaryContactEmail?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}