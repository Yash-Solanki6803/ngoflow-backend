import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { NGO } from 'src/ngos/entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, NGO, User])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
