import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorseController } from './horse.controller';
import { HorseService } from './horse.service';
import { Horse } from './entities/horse.entity';
import { HorseViewEntity } from './entities/horse-view.entity';
import { FileService } from '../shared/services/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Horse, HorseViewEntity])],
  controllers: [HorseController],
  providers: [HorseService, FileService],
  exports: [HorseService],
})
export class HorsesModule {}