import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateOrganizationDTO {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;
}