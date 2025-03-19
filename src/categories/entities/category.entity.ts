import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subcategory } from './subcategory.entity';
import { NGO } from 'src/ngos/entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category)
  subCategories: Subcategory[];

  @OneToMany(() => NGO, (ngo) => ngo.category)
  ngos: NGO[];

  @ManyToMany(() => User, (user) => user.interestedCategories)
  users: User[];
}
