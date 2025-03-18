import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateNGODto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  description: string;

  @IsString()
  @IsNotEmpty()
  mission: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;
}
