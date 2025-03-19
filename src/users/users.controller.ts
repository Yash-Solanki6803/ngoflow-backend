// src/users/users.controller.ts
import {
  Controller,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateInterestsDto } from './dto/update-interests.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('interests')
  async setUserInterests(
    @Request() req,
    @Body() updateInterestsDto: UpdateInterestsDto,
  ) {
    return this.usersService.setUserInterests(req.user.id, updateInterestsDto);
  }

  @Patch('interests')
  async updateUserInterests(
    @Request() req,
    @Body() updateInterestsDto: UpdateInterestsDto,
  ) {
    return this.usersService.updateUserInterests(
      req.user.id,
      updateInterestsDto,
    );
  }
}
