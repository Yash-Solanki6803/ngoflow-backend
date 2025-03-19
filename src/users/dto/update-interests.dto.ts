// src/users/dto/update-interests.dto.ts
import { IsArray, IsInt, ArrayMaxSize } from 'class-validator';

export class UpdateInterestsDto {
  @IsArray()
  @ArrayMaxSize(5, { message: 'You can select up to 5 categories.' })
  @IsInt({ each: true })
  categoryIds: number[];

  @IsArray()
  @ArrayMaxSize(10, { message: 'You can select up to 10 subcategories.' })
  @IsInt({ each: true })
  subcategoryIds: number[];
}
