import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Subcategory])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
