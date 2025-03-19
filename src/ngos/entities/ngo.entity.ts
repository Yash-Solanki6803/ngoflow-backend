import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Category } from 'src/categories/entities/category.entity';

export enum NGOStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NGOAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

@Entity('ngos')
export class NGO {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  mission: string;

  @Column()
  location: string;

  @Column()
  contactEmail: string;

  @Column()
  contactPhone: string;

  @Column({ type: 'enum', enum: NGOStatus, default: NGOStatus.PENDING })
  status: NGOStatus;

  @ManyToOne(() => Category, (category) => category.ngos, {
    onDelete: 'SET NULL',
  })
  category: Category;

  @ManyToOne(() => User, (user) => user.ngos)
  user: User;

  @OneToMany(() => Campaign, (campaign) => campaign.ngo)
  campaigns: Campaign[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
