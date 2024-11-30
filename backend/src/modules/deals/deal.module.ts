import { Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { DealService, DocumentDownloadService } from './deal.service';
import { DealController } from './deal.controller';
import { Deal } from './entities/deal.entity';
import { DealStageManager } from './services/deal-stage-manager.service';
import { StatusManager } from './services/status-manager.service';
import { TimelineManager } from './services/timeline-manager.service';
import { ProcessValidator } from './services/process-validator.service';
import { Horse } from '../horses/entities/horse.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FileService } from '../shared/services/file.service';
import { DealEventsGateway } from './gateways/deal-events.gateway';
import { Repository } from 'typeorm';
import { CommentService } from './services/comment.service';
import { DealEventsEmitter } from './services/deal-events-emitter.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersModule } from '../users/users.module';
import { UserService } from '../users/user.service';
import { NotificationService } from './services/notification.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      Horse,
      UserEntity,
      DealStageManager,
      StatusManager,
      TimelineManager,
      ProcessValidator,
      DealEventsGateway,
      CommentService,
      DocumentDownloadService,
      DealEventsEmitter,
      EventEmitter2,
      UsersModule,
      UserService,
      NotificationService
    ])
  ],
  controllers: [DealController],
  providers: [
    DealService,
    FileService,
    DealStageManager,
    StatusManager,
    TimelineManager,
    ProcessValidator,
    DealEventsGateway,
    CommentService,
    DocumentDownloadService,
    DealEventsEmitter,
    EventEmitter2,
    UserService,
    NotificationService
  ],
  exports: [
    DealService, 
    DealStageManager, 
    StatusManager, 
    TimelineManager, 
    ProcessValidator, 
    DealEventsGateway, 
    CommentService, 
    DocumentDownloadService,
    DealEventsEmitter,
    EventEmitter2
  ],
})
export class DealsModule {
  
}