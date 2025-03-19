import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { NGO } from 'src/ngos/entities/ngo.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';

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

  @OneToMany(() => NGO, (ngo) => ngo.user)
  ngos: NGO[];

  @ManyToMany(() => Campaign, (campaign) => campaign.volunteers)
  campaigns: Campaign[];

  @ManyToMany(() => Category, (category) => category.users)
  @JoinTable()
  interestedCategories: Category[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.users)
  @JoinTable()
  interestedSubcategories: Subcategory[];

  @Column({ type: 'timestamp', nullable: true })
  lastInterestUpdate: Date;
}
