import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export enum UserRole {
  VOLUNTEER = 'volunteer',
  NGO = 'ngo',
  DEV = 'dev',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ select: false })
  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VOLUNTEER })
  @IsEnum(UserRole)
  role: UserRole;
}
