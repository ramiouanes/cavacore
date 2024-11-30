// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ThrottlerModule } from '@nestjs/throttler';
// import configuration from './config/configuration';
// import { validationSchema } from './config/validation.schema';
// import { getDatabaseConfig } from './config/database.config';
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { HorsesModule } from './modules/horses/horses.module';
// import { EventsModule } from './modules/events/events.module';
// import { SharedModule } from './modules/shared/shared.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load: [configuration],
//       validationSchema,
//     }),
//     TypeOrmModule.forRootAsync({
//       inject: [ConfigService],
//       useFactory: getDatabaseConfig,
//     }),
//     ThrottlerModule.forRoot({
//       ttl: 60,
//       limit: 100,
//     }),
//     AuthModule,
//     UsersModule,
//     HorsesModule,
//     EventsModule,
//     SharedModule,
//   ],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HorsesModule } from './modules/horses/horses.module';
import { DealsModule } from './modules/deals/deal.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './modules/admin/admin.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false, //process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    HorsesModule,
    AdminModule,
    DealsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}