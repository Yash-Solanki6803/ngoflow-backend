import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNGODto } from './dto/create-ngo.dto';
import { UpdateNgoDto } from './dto/update-ngo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NGO, NGOAction, NGOStatus } from './entities/ngo.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class NgosService {
  constructor(
    @InjectRepository(NGO)
    private readonly ngoRepository: Repository<NGO>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async applyForNGO(userId: number, createNGODto: CreateNGODto): Promise<NGO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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

  async getMyApplications(userId: number): Promise<NGO[]> {
    return this.ngoRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingApplications(devId: number): Promise<NGO[]> {
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

  async getMyNGO(userId: number): Promise<NGO> {
    // Find the approved NGO for this user
    const approvedNgo = await this.ngoRepository.findOne({
      where: { user: { id: userId }, status: NGOStatus.APPROVED },
    });

    if (!approvedNgo)
      throw new NotFoundException('No approved NGO found for this user');

    return approvedNgo;
  }

  create(createNgoDto: CreateNGODto) {
    return 'This action adds a new ngo';
  }

  findAll() {
    return `This action returns all ngos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ngo`;
  }

  update(id: number, updateNgoDto: UpdateNgoDto) {
    return `This action updates a #${id} ngo`;
  }

  remove(id: number) {
    return `This action removes a #${id} ngo`;
  }
}
