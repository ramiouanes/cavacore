import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('app.database.host'),
  port: configService.get('app.database.port'),
  username: configService.get('app.database.username'),
  password: configService.get('app.database.password'),
  database: configService.get('app.database.database'),
  schema: configService.get('app.database.schema'),
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: configService.get('app.env') === 'development',
  logging: configService.get('app.env') === 'development',
  ssl: configService.get('app.env') === 'production',
  autoLoadEntities: true,
});

