import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { NgosService } from './ngos.service';
import { CreateNGODto } from './dto/create-ngo.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { NGOAction } from './entities/ngo.entity';
import { Request } from 'express';

@Controller('ngos')
export class NgosController {
  constructor(private readonly ngosService: NgosService) {}

  @Roles([UserRole.VOLUNTEER])
  @Post('apply')
  async applyForNGO(@Req() req: Request, @Body() createNGODto: CreateNGODto) {
    return this.ngosService.applyForNGO(req.user?.id, createNGODto);
  }

  // Get user NGO applications
  @Roles([UserRole.VOLUNTEER, UserRole.NGO])
  @Get('my-applications')
  async getMyApplications(@Req() req: Request) {
    return this.ngosService.getMyApplications(req.user?.id);
  }

  // Get pending NGO applications (Only for DEVs)
  @Roles([UserRole.DEV])
  @Get('pending-applications')
  async getPendingApplications(@Req() req: Request) {
    return this.ngosService.getPendingApplications(req.user?.id);
  }

  // Review an NGO Application (Only for DEVs)
  @Roles([UserRole.DEV])
  @Patch('review')
  async reviewApplication(@Body() body: { ngoId: string; action: NGOAction }) {
    return this.ngosService.reviewApplication(body.ngoId, body.action);
  }

  // Get approved NGO for user.
  @Roles([UserRole.NGO])
  @Get('my-ngo')
  async getMyNGO(@Req() req: Request) {
    return this.ngosService.getMyNGO(req.user?.id);
  }

  // Delete an NGO Application (Only if pending)
  @Roles([UserRole.VOLUNTEER])
  @Delete('applications/:id')
  async deleteApplication(@Req() req: Request, @Param('id') ngoId: string) {
    return this.ngosService.deleteApplication(req.user?.id, ngoId);
  }

  // Delete an NGO (Only if it's approved, deletes campaigns & registrations)
  @Roles([UserRole.NGO])
  @Delete(':id')
  async deleteNGO(@Req() req: Request, @Param('id') ngoId: string) {
    return this.ngosService.deleteNGO(req.user?.id, ngoId);
  }
}
