import { IsOptional, IsString, Length } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @Length(2, 100)
    name: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    description?: string;
}