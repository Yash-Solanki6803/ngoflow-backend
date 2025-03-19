import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles([UserRole.NGO])
  createCampaign(@Req() req: Request, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(req.user, dto);
  }

  @Get()
  @Public()
  getCampaigns(
    @Query('ngoId') ngoId?: string,
    @Query('search') search?: string,
    @Query('location') location?: string,
    @Query('categories') categories?: string, //1,2,3
  ) {
    const categoryIds = categories
      ? categories.split(',').map((id) => Number(id))
      : [];

    if (ngoId) {
      return this.campaignsService.getCampaignsByNGO(ngoId);
    }
    return this.campaignsService.getAllCampaigns(search, location, categoryIds);
  }

  // Get user's registered campaigns
  @Get('/registered')
  @Roles([UserRole.VOLUNTEER])
  getRegisteredCampaigns(@Req() req: Request) {
    return this.campaignsService.getRegisteredCampaigns(req.user);
  }

  // Get all volunteers for a campaign
  @Get('/:campaignId/volunteers')
  @Roles([UserRole.NGO])
  getVolunteersForCampaign(@Param('campaignId') campaignId: string) {
    return this.campaignsService.getVolunteersForCampaign(campaignId);
  }

  // Get single campaign
  @Get('/:campaignId')
  @Public() // Now this API is public
  getSingleCampaign(@Param('campaignId') campaignId: string) {
    return this.campaignsService.getSingleCampaign(campaignId);
  }

  @Put('/:id')
  @Roles([UserRole.NGO])
  updateCampaign(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(req.user, id, dto);
  }

  @Delete('/:id')
  @Roles([UserRole.NGO])
  deleteCampaign(@Req() req: Request, @Param('id') id: string) {
    return this.campaignsService.deleteCampaign(req.user, id);
  }

  // Register to a campaign as volunteer
  @Post('/:id/register')
  @Roles([UserRole.VOLUNTEER])
  registerToCampaign(@Req() req: Request, @Param('id') id: string) {
    return this.campaignsService.registerForCampaign(req.user, id);
  }

  // Unregister from a campaign as volunteer
  @Delete('/:id/register')
  @Roles([UserRole.VOLUNTEER])
  unregisterFromCampaign(@Req() req: Request, @Param('id') id: string) {
    return this.campaignsService.unregisterFromCampaign(req.user, id);
  }
}
