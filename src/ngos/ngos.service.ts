import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateNGODto } from './dto/create-ngo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NGO, NGOAction, NGOStatus } from './entities/ngo.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class NgosService {
  constructor(
    @InjectRepository(NGO)
    private readonly ngoRepository: Repository<NGO>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Create a new NGO application
  async applyForNGO(
    userId: number | undefined,
    createNGODto: CreateNGODto,
  ): Promise<NGO> {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id: +userId },
      relations: ['ngos'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has an approved NGO
    const approvedNGO = user.ngos.find(
      (ngo) => ngo.status === NGOStatus.APPROVED,
    );
    if (approvedNGO) {
      throw new BadRequestException(
        'You already have an approved NGO and cannot apply for another.',
      );
    }

    // Fetch and validate category
    const category = await this.categoryRepository.findOne({
      where: { id: createNGODto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Create a new NGO application
    const ngo = this.ngoRepository.create({
      ...createNGODto,
      user,
      category, // Assign category
    });

    try {
      return await this.ngoRepository.save(ngo);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique constraint violation
        throw new BadRequestException('An NGO with this name already exists.');
      }
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  // Get all NGO applications for a user
  async getMyApplications(userId: number | undefined): Promise<NGO[]> {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.ngoRepository.find({
      where: { user: { id: +userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get all pending NGO applications for review
  async getPendingApplications(devId: number | undefined): Promise<NGO[]> {
    if (!devId) {
      throw new BadRequestException('Invalid user ID');
    }
    const dev = await this.userRepository.findOne({
      where: { id: devId },
    });

    if (!dev) {
      throw new NotFoundException('User not found');
    }

    return this.ngoRepository.find({
      where: { status: NGOStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Review an NGO application (Approve/Reject)
  async reviewApplication(
    ngoId: string,
    action: NGOAction,
  ): Promise<{ message: string }> {
    const ngoApplication = await this.ngoRepository.findOne({
      where: { id: ngoId },
      relations: {
        user: {
          campaigns: true,
          followedNGOs: true,
          interestedCategories: true,
          interestedSubcategories: true,
        },
      },
    });

    if (!ngoApplication) {
      throw new NotFoundException('NGO application not found');
    }

    console.log(ngoApplication);
    if (ngoApplication.status !== NGOStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be reviewed',
      );
    }

    const user = ngoApplication.user;

    if (action === NGOAction.APPROVE) {
      // Approve the application
      ngoApplication.status = NGOStatus.APPROVED;
      await this.ngoRepository.save(ngoApplication);

      // Remove all volunteer-related data before changing role
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'followedNGOs')
        .of(ngoApplication.user.id)
        .remove(user.campaigns); // Remove all followed NGOs

      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'campaigns')
        .of(ngoApplication.user.id)
        .remove(user.campaigns); // Remove all registered campaigns

      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'interestedCategories')
        .of(ngoApplication.user.id)
        .remove(user.interestedCategories); // Remove all interested categories

      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'interestedSubcategories')
        .of(ngoApplication.user.id)
        .remove(user.interestedSubcategories); // Remove all interested subcategories

      // Update user role to NGO
      await this.userRepository.update(ngoApplication.user.id, {
        role: UserRole.NGO,
      });

      // Reject all other pending applications from the same user
      await this.ngoRepository.update(
        { user: { id: ngoApplication.user.id }, status: NGOStatus.PENDING },
        { status: NGOStatus.REJECTED },
      );

      return {
        message:
          'NGO application approved successfully, user role updated to NGO',
      };
    } else {
      // Reject the application
      ngoApplication.status = NGOStatus.REJECTED;
      await this.ngoRepository.save(ngoApplication);

      return { message: 'NGO application rejected successfully' };
    }
  }

  // Get the approved NGO for a user
  async getMyNGO(userId: number | undefined): Promise<NGO> {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }

    // Find the approved NGO for this user
    const approvedNgo = await this.ngoRepository.findOne({
      where: { user: { id: userId }, status: NGOStatus.APPROVED },
      relations: {
        category: true,
      },
    });

    if (!approvedNgo)
      throw new NotFoundException('No approved NGO found for this user');

    return approvedNgo;
  }

  // Get suggested NGOs for the logged-in user
  async getSuggestedNGOs(userId?: number) {
    if (!userId) return []; // User not logged in

    // Fetch user's interested categories
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        interestedCategories: true,
        followedNGOs: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const categoryIds = user.interestedCategories?.map((c) => c.id) || [];
    const followedNgoIds = user.followedNGOs?.map((ngo) => ngo.id) || [];

    // Build the query
    const queryBuilder = this.ngoRepository
      .createQueryBuilder('ngo')
      .leftJoinAndSelect('ngo.category', 'category')
      .where('ngo.status = :status', { status: 'approved' }) // Only approved NGOs
      .orderBy('ngo.updatedAt', 'DESC');

    // Filter NGOs by user's interested categories (if available)
    if (categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    if (followedNgoIds.length > 0) {
      queryBuilder.andWhere('ngo.id NOT IN (:...followedNgoIds)', {
        followedNgoIds,
      });
    }

    const ngos = await queryBuilder.getMany();
    return ngos;
  }

  async toggleFollowNGO(userId: number | undefined, ngoId: string) {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Only logged in users can follow NGOs');
    }

    if (user.role !== UserRole.VOLUNTEER) {
      throw new ForbiddenException('Only volunteers can follow NGOs');
    }

    const ngo = await this.ngoRepository.findOne({
      where: { id: ngoId },
      relations: ['followers'],
    });

    if (!ngo) {
      throw new NotFoundException('NGO not found');
    }

    const isAlreadyFollowing = ngo.followers.some(
      (follower) => follower.id === user.id,
    );

    if (isAlreadyFollowing) {
      ngo.followers = ngo.followers.filter(
        (follower) => follower.id !== user.id,
      );
      await this.ngoRepository.save(ngo);
      return { message: 'Unfollowed the NGO successfully', following: false };
    }

    ngo.followers.push(user);
    await this.ngoRepository.save(ngo);

    return { message: 'Followed the NGO successfully', following: true };
  }

  // Get NGO by ID
  async getNgoById(ngoId: string) {
    const ngo = await this.ngoRepository
      .createQueryBuilder('ngo')
      .leftJoinAndSelect('ngo.user', 'user')
      .leftJoinAndSelect('ngo.category', 'category')
      .leftJoinAndSelect('ngo.followers', 'followers')
      .leftJoinAndSelect('ngo.campaigns', 'campaigns')
      .leftJoin('campaigns.volunteers', 'volunteers')
      .where('ngo.id = :ngoId', { ngoId })
      .select([
        'ngo.id',
        'ngo.name',
        'ngo.description',
        'ngo.location',
        'ngo.status',
        'ngo.createdAt',
        'user.id',
        'user.name',
        'category.id',
        'category.name',
      ])
      .addSelect('COUNT(DISTINCT followers.id)', 'followerCount')
      .addSelect('COUNT(DISTINCT campaigns.id)', 'campaignCount')
      .addSelect('COUNT(volunteers.id)', 'totalRegistrations')
      .groupBy('ngo.id, user.id, category.id')
      .getRawOne();

    if (!ngo) {
      throw new NotFoundException('NGO not found');
    }
    if (ngo.ngo_status !== NGOStatus.APPROVED) {
      throw new ForbiddenException('Only approved NGOs can be viewed');
    }

    return {
      id: ngo.ngo_id,
      name: ngo.ngo_name,
      description: ngo.ngo_description,
      location: ngo.ngo_location,
      status: ngo.ngo_status,
      createdAt: ngo.ngo_createdAt,
      owner: {
        id: ngo.user_id,
        name: ngo.user_name,
      },
      category: {
        id: ngo.category_id,
        name: ngo.category_name,
      },
      followerCount: Number(ngo.followerCount),
      campaignCount: Number(ngo.campaignCount),
      totalRegistrations: Number(ngo.totalRegistrations),
    };
  }

  // ❌ Delete an NGO Application (Only if pending)
  async deleteApplication(userId: number | undefined, ngoId: string) {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }
    const ngo = await this.ngoRepository.findOne({
      where: { id: ngoId, user: { id: userId } },
    });

    if (!ngo) {
      throw new NotFoundException('NGO application not found');
    }

    if (ngo.status !== NGOStatus.PENDING) {
      throw new ForbiddenException('Only pending applications can be deleted');
    }

    await this.ngoRepository.remove(ngo);
    return { message: 'NGO application deleted successfully' };
  }

  // ❌ Delete an NGO (Only if approved, deletes campaigns & registrations)
  async deleteNGO(userId: number | undefined, ngoId: string) {
    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Only logged in users can delete NGOs');
    }

    const ngo = await this.ngoRepository.findOne({
      where: { id: ngoId },
      relations: ['user', 'campaigns'],
    });

    if (!ngo) {
      throw new NotFoundException('NGO not found');
    }

    // Only allow dev users OR the NGO owner to delete
    if (user.role !== UserRole.DEV && ngo.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own NGO');
    }

    if (ngo.status !== NGOStatus.APPROVED) {
      throw new ForbiddenException('Only approved NGOs can be deleted');
    }

    // Remove volunteers & subcategories from each campaign
    for (const campaign of ngo.campaigns) {
      campaign.volunteers = [];
      campaign.subcategories = [];
      await this.campaignRepository.save(campaign);
    }

    // Delete all campaigns under the NGO
    if (ngo.campaigns.length > 0) {
      await this.campaignRepository.remove(ngo.campaigns);
    }

    // Delete the NGO
    await this.ngoRepository.remove(ngo);

    // Change the role of the user back to volunteer if he is not a dev
    if (user.role !== UserRole.DEV)
      await this.userRepository.update(user.id, { role: UserRole.VOLUNTEER });

    return { message: 'NGO and all related campaigns deleted successfully' };
  }
}
