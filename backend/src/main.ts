import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import type { FastifyPluginCallback } from 'fastify';
import { FileLogger } from './utils/logger';


async function bootstrap() {

  const projectRoot = join(__dirname, '..');
  const uploadsPath = join(projectRoot, '..', 'uploads');
  const thumbnailsPath = join(uploadsPath, 'thumbnails');

  const logger = FileLogger.getInstance();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  
  // Get typed fastify instance
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // Add logging for multipart configuration
  logger.log('Configuring multipart handling...');

  // Register multipart with type assertion
  await fastifyInstance.register(fastifyMultipart as any, {
    limits: {
      fieldSize: 5 * 1024 * 1024,
      fileSize: 5 * 1024 * 1024,
      files: 10,
      fields: 10
    },
    attachFieldsToBody: false,
    throwFileSizeLimit: true,
    onFile: (file: any) => {
      console.log('Received file:', file.fieldname, file.filename);
    }
  });

  // Register static file serving
  await (fastifyInstance as any).register(fastifyStatic, {
    root: uploadsPath,
    prefix: '/uploads/',
    decorateReply: false,
    list: true,
  });

  
  // Enable CORS
  app.enableCors({
    // origin: ['http://localhost:5173', 'http://192.168.100.63:5173'],
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api'); 

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );


  // Listen on all interfaces
  await app.listen(3000, '0.0.0.0');
  
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();