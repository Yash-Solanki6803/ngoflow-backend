import { Module } from '@nestjs/common';
import { NgosService } from './ngos.service';
import { NgosController } from './ngos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NGO } from './entities/ngo.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NGO, User])],
  controllers: [NgosController],
  providers: [NgosService],
})
export class NgosModule {}
