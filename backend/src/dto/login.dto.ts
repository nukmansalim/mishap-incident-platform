import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class loginDto {
    @IsOptional()
    @IsString()
    id?: string;   // optional, biasanya tidak dikirim saat login

    @IsOptional()
    @IsString()
    name?: string; // optional, tidak perlu untuk login

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

}