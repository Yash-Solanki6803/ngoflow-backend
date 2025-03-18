import { PartialType } from '@nestjs/mapped-types';
import { CreateNGODto } from './create-ngo.dto';

export class UpdateNgoDto extends PartialType(CreateNGODto) {}
