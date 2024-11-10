import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  const configService = app.get(ConfigService);
  
  // Configure multipart/form-data support
  await app.register(fastifyMultipart);
  
  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // CORS
  app.enableCors({
    origin: configService.get('app.cors.origins'),
    credentials: true,
  });
  
  // API prefix
  const apiPrefix = configService.get('app.api.prefix');
  const apiVersion = configService.get('app.api.version');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
  
  const port = configService.get('app.port');
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

