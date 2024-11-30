// backend/src/modules/horses/horse.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
// import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HorseService } from './horse.service';
import { CreateHorseDto, UpdateHorseDto } from './dto/horse.dto';
import { FileService, UploadedFile } from '../shared/services/file.service';
import { FastifyFiles, ProcessedFile, FastifyRequest } from '../../shared/fastify-files.interceptor';
import { FileLogger } from '../../utils/logger';
import { HorseGender } from './entities/horse.entity';
import { v4 as uuidv4 } from 'uuid';


interface RequestWithUser extends FastifyRequest {
  user: { id: string };
  processedFields?: Record<string, string>;
  processedFiles?: ProcessedFile[];
}

export interface SearchParams {
  page: number;
  limit: number;
  breed?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  discipline?: string;
  gender?: HorseGender;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
  registrationNumber?: string;
  searchQuery?: string;
}

interface FileServiceInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size?: number;
}

interface RequestWithUser extends FastifyRequest {
  user: {
    id: string;
  };
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

@Controller('horses')
@UseGuards(JwtAuthGuard)
export class HorseController {
  constructor(
    private readonly horseService: HorseService,
    private readonly fileService: FileService
  ) { }

  @Post()
  @FastifyFiles(
    [
      { name: 'mediaFiles', maxCount: 20 },
      { name: 'vetFiles', maxCount: 20 }
    ],
    {
      maxFileSize: 15 * 1024 * 1024,
      maxFiles: 40,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    }
  )
  async createHorse(
    @Req() req: RequestWithUser,
    // @Body() createHorseDto: any,
  ) {
    const logger = FileLogger.getInstance();

    logger.log('Raw request received:', {
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    try {

      logger.log('Starting fields processing');
      const fields = req.processedFields || {};
      logger.log('fields obtained:', fields);

      logger.log('Starting files processing');
      const files = req.processedFiles || [];
      logger.log('files obtained:', files);

      // Process all fields
      logger.log('processFormData fields: ', fields);
      logger.log('processFormData files: ', files);
      const processedData = this.processFormData(fields, files);
      logger.log('Form Data Processes:', processedData);

      // Add owner information
      logger.log('Process Final Data');
      const finalData = {
        ...processedData,
        owner: { id: req.user.id }
      };
      logger.log('Final Data:', finalData);

      // Create horse
      const result = await this.horseService.createHorse(finalData);
      return result;

    } catch (error) {
      logger.error('Error parsing JSON fields:', error);
      throw new BadRequestException('Invalid JSON in form fields');
    }
  }

  private processFormData(fields: Record<string, any>, files: ProcessedFile[]) {
    // Extract and parse JSON fields
    const logger = FileLogger.getInstance();
    logger.log('fields.basicInfo: ', this.extractFieldValue(fields.basicInfo));
    const basicInfo = JSON.parse(this.extractFieldValue(fields.basicInfo));
    const performance = JSON.parse(this.extractFieldValue(fields.performance));
    const mediaMetadata = JSON.parse(this.extractFieldValue(fields.media));
    const health = JSON.parse(this.extractFieldValue(fields.health));
    const lineage = JSON.parse(this.extractFieldValue(fields.lineage));

    // Process media files
    const mediaFiles = files.filter(file => file.fieldname === 'mediaFiles');
    const processedMedia = mediaMetadata.map((item: any, index: number) => ({
      url: null, // Will be set by service
      thumbnailUrl: null, // Will be set by service
      type: 'image',
      caption: item.caption || '',
      isMain: item.isMain || index === 0,
      buffer: mediaFiles[index]?.buffer,
      originalname: mediaFiles[index]?.originalname,
      mimetype: mediaFiles[index]?.mimetype
    }));

    // Process health records
    const processedHealth = {
      ...health,
      vetRecords: health.vetRecords?.map((record: any) => ({
        ...record,
        files: [] // Vet files will be handled by the service
      })) || []
    };

    return {
      basicInfo,
      performance,
      media: processedMedia,
      health: processedHealth,
      lineage
    };
  }

  private extractFieldValue(field: any): any {
    const logger = FileLogger.getInstance();
    logger.log('type of field: ', typeof field);
    if (!field) return null;

    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }

    // Handle Field object format
    if (field.value && typeof field === 'object') {
      logger.log('field.value: ', field.value);
      return field.value;
    }

    // Extract JSON from Field string format
    const match = field.toString().match(/Field\([^)]+\): (.*)/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (error: any) {
        throw new BadRequestException(`Invalid JSON in field: ${error.message}`);
      }
    }

    return field;
  }



  @Get()
  @UsePipes(new ValidationPipe())
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('breed') breed?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('location') location?: string,
    @Query('discipline') discipline?: string,
    @Query('gender') gender?: HorseGender,
    @Query('minAge') minAge?: number,
    @Query('maxAge') maxAge?: number,
    @Query('minHeight') minHeight?: number,
    @Query('maxHeight') maxHeight?: number,
    @Query('color') color?: string,
    @Query('registrationNumber') registrationNumber?: string,
    @Query('searchQuery') searchQuery?: string
  ) {
    // Type validation and conversion
    const sanitizedParams: SearchParams = {
      page: Number(page),
      limit: Number(limit),
      ...(breed && { breed }),
      ...(minPrice && { minPrice: Number(minPrice) }),
      ...(maxPrice && { maxPrice: Number(maxPrice) }),
      ...(location && { location }),
      ...(discipline && { discipline }),
      ...(gender && Object.values(HorseGender).includes(gender as HorseGender) && { gender }),
      ...(minAge && { minAge: Number(minAge) }),
      ...(maxAge && { maxAge: Number(maxAge) }),
      ...(minHeight && { minHeight: Number(minHeight) }),
      ...(maxHeight && { maxHeight: Number(maxHeight) }),
      ...(color && { color }),
      ...(registrationNumber && { registrationNumber }),
      ...(searchQuery && { searchQuery })
    };

    return this.horseService.findAllHorses(sanitizedParams);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe())
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.horseService.findHorseById(id, userId);
  }


  @Put(':id')
  @FastifyFiles(
    [
      { name: 'mediaFiles', maxCount: 20 },
      { name: 'vetFiles', maxCount: 20 }
    ],
    {
      maxFileSize: 15 * 1024 * 1024,
      maxFiles: 40,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    }
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHorseDto: any,
    @Req() req: RequestWithUser,
  ) {
    try {
      const processedFiles = req.processedFiles || [];
      const mediaFiles = processedFiles.filter(file => file.fieldname === 'mediaFiles');
      const vetFiles = processedFiles.filter(file => file.fieldname === 'vetFiles');

      const parsedData = {
        basicInfo: JSON.parse(updateHorseDto.basicInfo as unknown as string),
        media: JSON.parse(updateHorseDto.media as unknown as string),
        performance: JSON.parse(updateHorseDto.performance as unknown as string),
        health: JSON.parse(updateHorseDto.health as unknown as string),
        lineage: JSON.parse(updateHorseDto.lineage as unknown as string),
      };


      // Process new media files if any
      const newMediaUploads = mediaFiles.length > 0
        ? await Promise.all(
          mediaFiles.map(async (file, index) => {
            const fileInput: FileServiceInput = {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.buffer.length
            };

            const result = await this.fileService.uploadFile(fileInput, 'image', uuidv4(), true);
            return {
              url: result.url,
              thumbnailUrl: result.thumbnailUrl,
              type: parsedData.media[index].type,
              caption: parsedData.media[index].caption,
              isMain: index === 0,
              metadata: result.metadata
            };
          })
        )
        : [];

      // Process new vet files if any
      const newVetUploads = vetFiles.length > 0
        ? await Promise.all(
          vetFiles.map(async (file) => {
            const fileInput: FileServiceInput = {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.buffer.length
            };

            const result = await this.fileService.uploadFile(fileInput, 'veterinary', uuidv4());
            return {
              url: result.url,
              originalName: file.originalname,
              metadata: result.metadata
            };
          })
        )
        : [];

      // Combine existing and new media
      const finalMedia = [
        ...parsedData.media.filter((m: any) => m.url), // Keep existing media
        ...newMediaUploads
      ];

      // Update vet records with new files
      const updatedVetRecords = parsedData.health.vetRecords.map((record: any, index: number) => {
        const existingFiles = record.files.filter((f: any) => f.url);
        const newFiles = newVetUploads.slice(
          index * (record.files.length - existingFiles.length),
          (index + 1) * (record.files.length - existingFiles.length)
        );
        return {
          ...record,
          files: [...existingFiles, ...newFiles]
        };
      });

      const finalData = {
        ...parsedData,
        media: finalMedia,
        health: {
          ...parsedData.health,
          vetRecords: updatedVetRecords
        }
      };

      return await this.horseService.updateHorse(id, req.user.id, finalData);
    } catch (error: any) {
      // Cleanup new files if update fails
      throw new BadRequestException(
        error.message || 'Failed to update horse profile'
      );

    }
  }

  @Delete(':id')
  @UsePipes(new ValidationPipe())
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.horseService.deleteHorse(id, userId);
  }

  @Post(':id/view')
  @UsePipes(new ValidationPipe())
  async recordView(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.horseService.recordView(id, userId);
  }
}