import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles([UserRole.DEV]) // Only admins can create categories
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Post(':id/subcategories')
  @Roles([UserRole.DEV])
  createSubcategory(
    @Param('id') categoryId: number,
    @Body('name') name: string,
  ) {
    return this.categoriesService.createSubcategory(categoryId, name);
  }

  @Patch(':id')
  @Roles([UserRole.DEV])
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch('subcategories/:id')
  @Roles([UserRole.DEV])
  updateSubcategory(
    @Param('id') subcategoryId: number,
    @Body('name') name: string,
  ) {
    return this.categoriesService.updateSubcategory(subcategoryId, name);
  }

  @Delete(':id')
  @Roles([UserRole.DEV])
  remove(@Param('id') id: number) {
    return this.categoriesService.remove(id);
  }

  @Delete('subcategories/:id')
  @Roles([UserRole.DEV])
  removeSubcategory(@Param('id') subcategoryId: number) {
    return this.categoriesService.removeSubcategory(subcategoryId);
  }
}
