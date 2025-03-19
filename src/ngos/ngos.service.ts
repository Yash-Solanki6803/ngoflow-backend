import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNGODto } from './dto/create-ngo.dto';
import { UpdateNgoDto } from './dto/update-ngo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NGO, NGOAction, NGOStatus } from './entities/ngo.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Campaign } from 'src/campaigns/entities/campaign.entity';

@Injectable()
export class NgosService {
  constructor(
    @InjectRepository(NGO)
    private readonly ngoRepository: Repository<NGO>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Apply for an NGO (Volunteer only)
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

    // Create a new NGO application
    const ngo = this.ngoRepository.create({ ...createNGODto, user });
    return this.ngoRepository.save(ngo);
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
      relations: ['user'], // Fetch related user entity
    });

    if (!ngoApplication)
      throw new NotFoundException('NGO application not found');

    if (ngoApplication.status !== NGOStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be reviewed',
      );
    }

    if (action === NGOAction.APPROVE) {
      // Approve the application
      ngoApplication.status = NGOStatus.APPROVED;
      await this.ngoRepository.save(ngoApplication);

      // Update user role to 'ngo'
      await this.userRepository.update(ngoApplication.user.id, {
        role: UserRole.NGO,
      });

      // Reject all other applications from the same user
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
    });

    if (!approvedNgo)
      throw new NotFoundException('No approved NGO found for this user');

    return approvedNgo;
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

    const ngo = await this.ngoRepository.findOne({
      where: { id: ngoId, user: { id: userId } },
      relations: ['campaigns'],
    });

    if (!ngo) {
      throw new NotFoundException('NGO not found');
    }

    if (ngo.status !== NGOStatus.APPROVED) {
      throw new ForbiddenException('Only approved NGOs can be deleted');
    }

    // Loop through each campaign and remove all volunteers from it
    for (const campaign of ngo.campaigns) {
      if (campaign.volunteers.length > 0) {
        campaign.volunteers = [];
        await this.campaignRepository.save(campaign);
      }
    }

    // Delete all related campaigns (which will auto-delete registrations due to cascade)
    if (ngo.campaigns.length > 0) {
      await this.campaignRepository.remove(ngo.campaigns);
    }

    // Delete the NGO
    await this.ngoRepository.remove(ngo);
    return { message: 'NGO and all related campaigns deleted successfully' };
  }
}
