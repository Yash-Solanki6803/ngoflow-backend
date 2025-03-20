import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NGO } from 'src/ngos/entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.campaigns)
  @JoinTable()
  subcategories: Subcategory[];

  @ManyToOne(() => NGO, (ngo) => ngo.campaigns, { onDelete: 'CASCADE' })
  ngo: NGO;

  @ManyToMany(() => User, (user) => user.campaigns)
  @JoinTable()
  volunteers: User[];

  @ManyToMany(() => User, (user) => user.likedCampaigns)
  likedBy: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
