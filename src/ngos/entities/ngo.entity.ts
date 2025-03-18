import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

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

  @ManyToOne(() => User, (user) => user.ngos, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
