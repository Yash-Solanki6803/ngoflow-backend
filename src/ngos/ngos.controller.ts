import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { NgosService } from './ngos.service';
import { CreateNGODto } from './dto/create-ngo.dto';
import { UpdateNgoDto } from './dto/update-ngo.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { NGOAction } from './entities/ngo.entity';

@Controller('ngos')
export class NgosController {
  constructor(private readonly ngosService: NgosService) {}

  @Roles([UserRole.VOLUNTEER])
  @Post('apply')
  async applyForNGO(@Request() req, @Body() createNGODto: CreateNGODto) {
    return this.ngosService.applyForNGO(+req.user.id, createNGODto);
  }

  @Roles([UserRole.VOLUNTEER, UserRole.NGO])
  @Get('my-applications')
  async getMyApplications(@Request() req) {
    return this.ngosService.getMyApplications(+req.user.id);
  }

  @Roles([UserRole.DEV])
  @Get('pending-applications')
  async getPendingApplications(@Request() req) {
    return this.ngosService.getPendingApplications(+req.user.id);
  }

  @Roles([UserRole.DEV])
  @Patch('review')
  async reviewApplication(@Body() body: { ngoId: string; action: NGOAction }) {
    return this.ngosService.reviewApplication(body.ngoId, body.action);
  }

  @Roles([UserRole.NGO])
  @Get('my-ngo')
  async getMyNGO(@Request() req) {
    return this.ngosService.getMyNGO(+req.user.id);
  }

  @Post()
  create(@Body() createNgoDto: CreateNGODto) {
    return this.ngosService.create(createNgoDto);
  }

  @Get()
  findAll() {
    return this.ngosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ngosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNgoDto: UpdateNgoDto) {
    return this.ngosService.update(+id, updateNgoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ngosService.remove(+id);
  }
}
