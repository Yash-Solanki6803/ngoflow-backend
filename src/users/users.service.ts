import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { In, Repository } from 'typeorm';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async setUserInterests(
    userId: number,
    updateInterestsDto: UpdateInterestsDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found.');

    if (user.lastInterestUpdate) {
      throw new BadRequestException('User interests already set.');
    }

    const categories = await this.categoryRepository.findBy({
      id: In(updateInterestsDto.categoryIds),
    });
    const subcategories = await this.subcategoryRepository.findBy({
      id: In(updateInterestsDto.subcategoryIds),
    });

    user.interestedCategories = categories;
    user.interestedSubcategories = subcategories;
    user.lastInterestUpdate = new Date();

    await this.userRepository.save(user);
    return { message: 'User interests set successfully.' };
  }

  async updateUserInterests(
    userId: number,
    updateInterestsDto: UpdateInterestsDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found.');

    // Check if 30 days have passed since last update
    const today = new Date();
    if (user.lastInterestUpdate) {
      const timeDiff = today.getTime() - user.lastInterestUpdate.getTime();
      const daysPassed = timeDiff / (1000 * 60 * 60 * 24);
      if (daysPassed < 30) {
        throw new ForbiddenException(
          `You can update your interests after ${30 - Math.floor(daysPassed)} days.`,
        );
      }
    }

    const categories = await this.categoryRepository.findByIds(
      updateInterestsDto.categoryIds,
    );
    const subcategories = await this.subcategoryRepository.findByIds(
      updateInterestsDto.subcategoryIds,
    );

    user.interestedCategories = categories;
    user.interestedSubcategories = subcategories;
    user.lastInterestUpdate = new Date();

    await this.userRepository.save(user);
    return { message: 'User interests updated successfully.' };
  }
}
