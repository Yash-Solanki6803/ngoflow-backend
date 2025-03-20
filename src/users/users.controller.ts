// src/users/users.controller.ts
import {
  Controller,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('interests')
  async setUserInterests(
    @Req() req: Request,
    @Body() updateInterestsDto: UpdateInterestsDto,
  ) {
    return this.usersService.setUserInterests(updateInterestsDto, req.user?.id);
  }

  @Patch('interests')
  async updateUserInterests(
    @Req() req: Request,
    @Body() updateInterestsDto: UpdateInterestsDto,
  ) {
    return this.usersService.updateUserInterests(
      updateInterestsDto,
      req.user?.id,
    );
  }

  @Get('followed-ngos')
  @Roles([UserRole.VOLUNTEER])
  async getFollowedNGOs(@Req() req: Request) {
    return this.usersService.getUserFollowedNGOs(req.user?.id);
  }
}
