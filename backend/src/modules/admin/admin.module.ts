import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { Horse } from '../horses/entities/horse.entity';
import { AdminController } from '../admin/admin.controller';
import { AdminService } from '../admin/admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, Horse])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}