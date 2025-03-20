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
    userId?: number, // Extract from `req.user`
    search?: string,
    location?: string,
    categoryIds: number[] = [],
    subcategoryIds: number[] = [],
  ) {
    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.ngo', 'ngo')
      .leftJoinAndSelect('ngo.category', 'category')
      .leftJoinAndSelect('campaign.subcategories', 'subcategories')
      .loadRelationCountAndMap('campaign.likeCount', 'campaign.likedBy') // Get like count
      .loadRelationCountAndMap('campaign.volunteerCount', 'campaign.volunteers') // Get volunteer count
      .orderBy('campaign.updatedAt', 'DESC');

    // 🌟 If user is logged in, check their role
    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['role'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 🔥 Only filter by followed NGOs if the user is a Volunteer
      if (user.role === UserRole.VOLUNTEER) {
        queryBuilder
          .innerJoin(
            'users_followed_ng_os_ngos', // ✅ Correct table name
            'follow',
            'follow.ngosId = ngo.id',
          )
          .andWhere('follow.usersId = :userId', { userId });
      }
    }

    if (search) {
      queryBuilder.andWhere('campaign.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (location) {
      queryBuilder.andWhere('ngo.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    if (categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    if (subcategoryIds.length > 0) {
      queryBuilder.andWhere('subcategories.id IN (:...subcategoryIds)', {
        subcategoryIds,
      });
    }

    const campaigns = await queryBuilder.getMany();

    return campaigns.map(({ likedBy, volunteers, ...campaign }) => ({
      ...campaign,
      likedBy: undefined, // Ensure not included
      volunteers: undefined, // Ensure not included
    }));
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

  // Get suggested campaigns for the logged-in user
  // Get suggested campaigns for the logged-in user
  async getSuggestedCampaigns(userId?: number) {
    if (!userId) return []; // User not logged in

    // Fetch user's interested categories, subcategories & followed NGOs
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'interestedCategories',
        'interestedSubcategories',
        'followedNGOs',
      ],
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException(
        'Only volunteers can view suggested campaigns',
      );
    }

    const categoryIds = user.interestedCategories?.map((c) => c.id) || [];
    const subcategoryIds = user.interestedSubcategories?.map((s) => s.id) || [];
    const followedNgoIds = user.followedNGOs?.map((ngo) => ngo.id) || [];

    // If user has no interests, return []
    if (categoryIds.length === 0 && subcategoryIds.length === 0) return [];

    // Fetch campaigns matching the user's interests but exclude followed NGOs
    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.ngo', 'ngo')
      .leftJoinAndSelect('ngo.category', 'category')
      .leftJoinAndSelect('campaign.subcategories', 'subcategories')
      .loadRelationCountAndMap('campaign.likeCount', 'campaign.likedBy')
      .loadRelationCountAndMap('campaign.volunteerCount', 'campaign.volunteers')
      .orderBy('campaign.updatedAt', 'DESC');

    if (categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    if (subcategoryIds.length > 0) {
      queryBuilder.andWhere('subcategories.id IN (:...subcategoryIds)', {
        subcategoryIds,
      });
    }

    if (followedNgoIds.length > 0) {
      queryBuilder.andWhere('ngo.id NOT IN (:...followedNgoIds)', {
        followedNgoIds,
      });
    }

    const campaigns = await queryBuilder.getMany();

    return campaigns.map(({ likedBy, volunteers, ...campaign }) => ({
      ...campaign,
      likedBy: undefined,
      volunteers: undefined,
    }));
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

  // Like or unlike a campaign (toggle like)
  async toggleLikeCampaign(userId: number | undefined, campaignId: string) {
    if (!userId) {
      throw new ForbiddenException('Only logged-in users can like campaigns');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['likedCampaigns'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException('Only volunteers can like campaigns');
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['likedBy'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const isAlreadyLiked = campaign.likedBy.some((u) => u.id === user.id);

    if (isAlreadyLiked) {
      // Unlike the campaign
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'likedCampaigns')
        .of(user.id)
        .remove(campaign);

      return { message: 'Campaign un-liked successfully' };
    } else {
      // Like the campaign
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'likedCampaigns')
        .of(user.id)
        .add(campaign);

      return { message: 'Campaign liked successfully' };
    }
  }
}
