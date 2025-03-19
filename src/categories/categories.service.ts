import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  async findAll() {
    return this.categoryRepository.find({ relations: ['subCategories'] });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['subCategories'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    await this.categoryRepository.save(category);
    return {
      message: 'Category created successfully',
    };
  }

  async createSubcategory(categoryId: number, name: string) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: categoryId,
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    const subcategory = this.subcategoryRepository.create({ name, category });
    return this.subcategoryRepository.save(subcategory);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async updateSubcategory(subcategoryId: number, name: string) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: {
        id: subcategoryId,
      },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    subcategory.name = name;
    return this.subcategoryRepository.save(subcategory);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepository.remove(category);
  }

  async removeSubcategory(subcategoryId: number) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: {
        id: subcategoryId,
      },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return this.subcategoryRepository.remove(subcategory);
  }
}
