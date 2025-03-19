import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { NGO } from 'src/ngos/entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, NGO, User, Subcategory])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
