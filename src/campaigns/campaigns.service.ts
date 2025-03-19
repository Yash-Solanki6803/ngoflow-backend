import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { NGO, NGOStatus } from 'src/ngos/entities/ngo.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(NGO)
    private readonly ngoRepository: Repository<NGO>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  // Create a campaign (NGO only)
  async createCampaign(user: User | null, dto: CreateCampaignDto) {
    if (!user) {
      throw new ForbiddenException('Only logged in users can create campaigns');
    }

    if (user.role !== UserRole.NGO) {
      throw new ForbiddenException('Only NGO owners can create campaigns');
    }

    const ngo = await this.ngoRepository.findOne({
      where: { user: { id: user.id }, status: NGOStatus.APPROVED },
    });

    if (!ngo) {
      throw new BadRequestException('You do not have an approved NGO');
    }

    // Fetch subcategories
    const subcategories = await this.subcategoryRepository.find({
      where: { id: In(dto.subcategoryIds) },
    });

    if (subcategories.length !== dto.subcategoryIds.length) {
      throw new BadRequestException('Some subcategories do not exist.');
    }

    const campaign = this.campaignRepository.create({
      ...dto,
      ngo,
      subcategories,
    });
    await this.campaignRepository.save(campaign);

    return {
      message: 'Campaign created successfully',
      campaign: {
        id: campaign.id,
      },
    };
  }

  // Get all campaigns (Public)
  async getAllCampaigns(
    search?: string,
    location?: string,
    categoryIds: number[] = [],
  ) {
    const filters: FindOptionsWhere<Campaign> | FindOptionsWhere<Campaign>[] = {
      title: search ? ILike(`%${search}%`) : undefined,
      ...(location ? { ngo: { location: ILike(`%${location}%`) } } : {}),
      ...(categoryIds.length > 0
        ? { ngo: { category: { id: In(categoryIds) } } }
        : {}),
    };

    return this.campaignRepository.find({
      relations: {
        ngo: { category: true },
      },
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        ngo: {
          id: true,
          name: true,
          location: true,
          category: {
            id: true,
            name: true,
          },
        },
      },
      order: { updatedAt: 'DESC' },
    });
  }

  // Get campaigns by NGO (NGO only)
  async getCampaignsByNGO(ngoId: string) {
    const campaigns = await this.campaignRepository.find({
      relations: {
        ngo: true,
      },
      select: {
        ngo: {
          id: true,
          name: true,
        },
      },
      where: { ngo: { id: ngoId } },
      order: { updatedAt: 'DESC' },
    });

    if (campaigns.length === 0) {
      throw new NotFoundException('No campaigns found for this NGO');
    }

    return campaigns;
  }

  // Get a single campaign (Public)
  async getSingleCampaign(campaignId: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['ngo'],
      select: {
        ngo: {
          id: true,
          name: true,
          description: true,
          mission: true,
          location: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  // Update a campaign (NGO only)
  async updateCampaign(
    user: User | null,
    campaignId: string,
    dto: UpdateCampaignDto,
  ) {
    if (!user) {
      throw new ForbiddenException('Only logged in users can update campaigns');
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: {
        ngo: {
          user: true,
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.ngo.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own campaigns');
    }

    // Fetch subcategories
    if (dto.subcategoryIds) {
      const subcategories = await this.subcategoryRepository.find({
        where: { id: In(dto.subcategoryIds) },
      });

      if (subcategories.length !== dto.subcategoryIds.length) {
        throw new BadRequestException('Some subcategories do not exist.');
      }

      campaign.subcategories = subcategories;
    }

    Object.assign(campaign, dto);
    await this.campaignRepository.save(campaign);

    return { message: 'Campaign updated successfully', campaign };
  }

  // Delete a campaign (NGO only)
  async deleteCampaign(user: User | null, campaignId: string) {
    if (!user) {
      throw new ForbiddenException('Only logged-in users can delete campaigns');
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: {
        ngo: {
          user: true,
        },
        volunteers: true,
        subcategories: true, // Load subcategories relation
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.ngo.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own campaigns');
    }

    // Remove all volunteers from the campaign
    if (campaign.volunteers.length > 0) {
      campaign.volunteers = [];
      await this.campaignRepository.save(campaign);
    }

    // Remove all subcategory relations
    if (campaign.subcategories.length > 0) {
      campaign.subcategories = [];
      await this.campaignRepository.save(campaign);
    }

    // Now safely remove the campaign
    await this.campaignRepository.remove(campaign);

    return { message: 'Campaign deleted successfully' };
  }

  // Register for a campaign (Volunteer only)
  async registerForCampaign(user: User | null, campaignId: string) {
    if (!user) {
      throw new ForbiddenException(
        'Only logged-in users can register for campaigns',
      );
    }

    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException(
        'Only volunteers can register for campaigns',
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: {
        volunteers: true,
        subcategories: true, // Load subcategories relation
        ngo: {
          category: true, // Load NGO category relation
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.volunteers.some((vol) => vol.id === user.id)) {
      throw new BadRequestException(
        'You are already registered for this campaign',
      );
    }

    // Load volunteer's interested categories & subcategories
    const volunteer = await this.userRepository.findOne({
      where: { id: user.id },
      relations: {
        interestedCategories: true,
        interestedSubcategories: true,
      },
    });

    if (!volunteer) {
      throw new NotFoundException('User not found');
    }

    // Get category & subcategory IDs
    const volunteerCategoryIds = volunteer.interestedCategories.map(
      (c) => c.id,
    );
    const volunteerSubcategoryIds = volunteer.interestedSubcategories.map(
      (s) => s.id,
    );

    const campaignSubcategoryIds = campaign.subcategories.map((s) => s.id);
    const ngoCategoryId = campaign.ngo.category?.id; // NGO category

    // Check for common categories or subcategories
    const hasCommonCategory =
      ngoCategoryId && volunteerCategoryIds.includes(ngoCategoryId);

    const hasCommonSubcategory = campaignSubcategoryIds.some((id) =>
      volunteerSubcategoryIds.includes(id),
    );

    if (!hasCommonCategory && !hasCommonSubcategory) {
      throw new ForbiddenException(
        'You can only register for campaigns that match your interests',
      );
    }

    // Register the volunteer
    campaign.volunteers.push(user);
    await this.campaignRepository.save(campaign);

    return { message: 'Successfully registered for the campaign' };
  }

  // Unregister from a campaign (Volunteer only)
  async unregisterFromCampaign(user: User | null, campaignId: string) {
    if (!user) {
      throw new ForbiddenException(
        'Only logged in users can unregister from campaigns',
      );
    }
    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException(
        'Only volunteers can unregister from campaigns',
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['volunteers'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    campaign.volunteers = campaign.volunteers.filter(
      (vol) => vol.id !== user.id,
    );
    await this.campaignRepository.save(campaign);

    return { message: 'Successfully unregistered from the campaign' };
  }

  // Get campaigns for a user (Volunteer only)
  async getRegisteredCampaigns(user: User | null) {
    if (!user) {
      throw new ForbiddenException('Only logged in users can view campaigns');
    }

    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException('Only volunteers can view campaigns');
    }

    return this.campaignRepository.find({
      relations: ['volunteers'],
      where: { volunteers: { id: user.id } },
      select: {
        volunteers: {
          id: true,
          name: true,
        },
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async getVolunteersForCampaign(campaignId: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['volunteers'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }
}
