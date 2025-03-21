import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @ArrayNotEmpty()
  subcategoryIds: number[];
}
