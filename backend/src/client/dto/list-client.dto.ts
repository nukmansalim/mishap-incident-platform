import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClientStatus, ClientType } from 'generated/prisma/enums';
export class ListClientsDto {
    @IsOptional()
    @IsEnum(ClientStatus)
    status?: ClientStatus;

    @IsOptional()
    @IsEnum(ClientType)
    type?: ClientType;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(0)
    skip?: number = 0;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    take?: number = 20;
}