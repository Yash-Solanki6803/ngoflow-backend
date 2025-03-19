import { Module } from '@nestjs/common';
import { NgosService } from './ngos.service';
import { NgosController } from './ngos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NGO } from './entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Category } from 'src/categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NGO, User, Campaign, Category])],
  controllers: [NgosController],
  providers: [NgosService],
})
export class NgosModule {}
