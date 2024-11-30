// backend/src/modules/horses/horse.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, Between, Like, In } from 'typeorm';
import { HorseViewEntity } from './entities/horse-view.entity';
import { Horse, HorseGender, DisciplineLevel } from './entities/horse.entity';
import { FileService } from '../shared/services/file.service';
import { FileLogger } from '../../utils/logger';

interface SearchParams {
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

@Injectable()
export class HorseService {
  constructor(
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
    @InjectRepository(HorseViewEntity)
    private readonly horseViewRepository: Repository<HorseViewEntity>,
    private fileService: FileService
  ) {}

  async createHorse(data: {
      basicInfo: any;
      performance: any;
      media: any[];
      health: any;
      lineage: any;
      owner: { id: string };
    }): Promise<Horse> {
    const logger = FileLogger.getInstance();
    logger.log('Creating horse with data:', data);
    try {
      // Validate data
      this.validateBasicInfo(data.basicInfo);
      this.validatePerformance(data.performance);
      this.validateHealth(data.health);
      this.validateLineage(data.lineage);

      if (!data.media || data.media.length === 0) {
        throw new BadRequestException('At least one media item is required');
      }

      // Process media files
      const processedMedia = await Promise.all(data.media.map(async (item, index) => {
        if (!item.buffer) return item;

        const uploadResult = await this.fileService.uploadFile({
          buffer: item.buffer,
          originalname: item.originalname,
          mimetype: item.mimetype
        }, 'image', item.id , true);

        return {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          type: item.type,
          caption: item.caption,
          isMain: index === 0
        };
      }));

      // Create horse entity
      const horse = this.horseRepository.create({
        basicInfo: {
          ...data.basicInfo,
          dateOfBirth: new Date(data.basicInfo.dateOfBirth)
        },
        media: processedMedia,
        performance: {
          ...data.performance,
          achievements: data.performance.achievements.map((a: any) => ({
            ...a,
            date: a.date ? new Date(a.date) : null
          }))
        },
        health: {
          ...data.health,
          vaccinations: data.health.vaccinations?.map((v: any) => ({
            ...v,
            date: v.date ? new Date(v.date) : null,
            nextDueDate: v.nextDueDate ? new Date(v.nextDueDate) : null
          })) || [],
          medicalRecords: data.health.medicalRecords?.map((r: any) => ({
            ...r,
            date: r.date ? new Date(r.date) : null
          })) || [],
          vetRecords: data.health.vetRecords?.map((r: any) => ({
            ...r,
            date: r.date ? new Date(r.date) : null
          })) || []
        },
        lineage: data.lineage,
        ownerId: data.owner.id,
        status: 'active'
      });

      logger.log('horse:', horse);
  
  

      return await this.horseRepository.save(horse);
    } catch (error: any) {
      throw new BadRequestException(
        error.message || 'Failed to create horse profile'
      );
    }
  }

  private extractFieldValue(field: any): any {
    if (!field) return null;
  
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
  
    // Handle Field object format
    if (field.value && typeof field.value === 'object') {
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

  async updateHorse(id: string, userId: string, updateData: any): Promise<Horse> {
    const horse = await this.horseRepository.findOne({
      where: { id, ownerId: userId }
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    // Validate update data
    this.validateBasicInfo(updateData.basicInfo);
    this.validatePerformance(updateData.performance);
    this.validateHealth(updateData.health);
    this.validateLineage(updateData.lineage);

    // Handle media updates
    const updatedMedia = await this.handleMediaUpdates(
      horse.media,
      updateData.media
    );

    // Prepare update data with proper date conversions
    const finalUpdateData = {
      ...updateData,
      media: updatedMedia,
      basicInfo: {
        ...updateData.basicInfo,
        dateOfBirth: new Date(updateData.basicInfo.dateOfBirth)
      },
      performance: {
        ...updateData.performance,
        achievements: updateData.performance.achievements.map((a: any) => ({
          ...a,
          date: new Date(a.date)
        }))
      },
      health: {
        ...updateData.health,
        vaccinations: updateData.health.vaccinations.map((v: any) => ({
          ...v,
          date: new Date(v.date),
          nextDueDate: new Date(v.nextDueDate)
        })),
        medicalRecords: updateData.health.medicalRecords.map((r: any) => ({
          ...r,
          date: new Date(r.date)
        })),
        vetRecords: updateData.health.vetRecords.map((r: any) => ({
          ...r,
          date: new Date(r.date)
        }))
      }
    };

    Object.assign(horse, finalUpdateData);
    return await this.horseRepository.save(horse);
  }

  async findHorseById(id: string, userId?: string): Promise<Horse> {
    const horse = await this.horseRepository.findOne({
      where: { id },
      relations: ['owner']
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    if (userId) {
      // Check if user has viewed this horse
      const view = await this.horseViewRepository.findOne({
        where: { horse: { id }, user: { id: userId } }
      });
      
      horse.isWishlisted = false; // TODO: Implement wishlist functionality
    }

    // Get view count
    const viewCount = await this.horseViewRepository.count({
      where: { horse: { id } }
    });

    return {
      ...horse,
      views: viewCount
    };
  }

  async findAllHorses(params: SearchParams) {
    const {
      page = 1,
      limit = 10,
      breed,
      discipline,
      gender,
      minAge,
      maxAge,
      color,
      searchQuery
    } = params;
  
    const skip = (page - 1) * limit;
  
    const queryBuilder = this.horseRepository.createQueryBuilder('horse')
      .leftJoinAndSelect('horse.owner', 'owner')
      .where('horse.status = :status', { status: 'active' });
  
    // Basic Info Filters
    if (breed) {
      queryBuilder.andWhere("horse.\"basicInfo\"->>'breed' ILIKE :breed", { breed: `%${breed}%` });
    }
  
    if (gender) {
      queryBuilder.andWhere("horse.\"basicInfo\"->>'gender' ILIKE :gender", { gender: `%${gender}%` });
    }
  
    if (color) {
      queryBuilder.andWhere("horse.\"basicInfo\"->>'color' ILIKE :color", { color: `%${color}%` });
    }
  
    // Age filter using dateOfBirth
    if (minAge || maxAge) {
      const now = new Date();
      if (minAge) {
        const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        queryBuilder.andWhere("(horse.\"basicInfo\"->>'dateOfBirth')::date <= :maxDate", { maxDate });
      }
      if (maxAge) {
        const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
        queryBuilder.andWhere("(horse.\"basicInfo\"->>'dateOfBirth')::date >= :minDate", { minDate });
      }
    }
  
    // Performance Filters
    if (discipline) {
      queryBuilder.andWhere("horse.\"performance\->>'disciplines' @> :discipline", { 
        discipline: JSON.stringify([discipline]) 
      });
    }
  
    // Search query across multiple fields
    if (searchQuery) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where("horse.\"basicInfo\"->>'name' ILIKE :search", { search: `%${searchQuery}%` })
          .orWhere("horse.\"basicInfo\"->>'breed' ILIKE :search", { search: `%${searchQuery}%` })
          // .orWhere("horse.lineage->>'registrationNumber' ILIKE :search", { search: `%${searchQuery}%` });
      }));
    }
  
    const [horses, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  
    // Get view counts
    const viewCounts = await this.horseViewRepository
      .createQueryBuilder('view')
      .select('view.horseId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('view.horseId')
      .getRawMany();
  
    const viewCountMap = viewCounts.reduce((acc: any, curr: any) => {
      acc[curr.horseId] = parseInt(curr.count);
      return acc;
    }, {});
  
    // Add view counts to horses
    const horsesWithViews = horses.map(horse => ({
      ...horse,
      views: viewCountMap[horse.id] || 0
    }));
  
    return {
      horses: horsesWithViews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteHorse(id: string, userId: string): Promise<void> {
    const horse = await this.horseRepository.findOne({
      where: { id, ownerId: userId }
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    // Delete associated files
    try {
      // Delete media files
      await Promise.all(
        horse.media.map(async (m) => {
          if (m.url) {
            await this.fileService.deleteFile(m.url);
          }
          if (m.thumbnailUrl) {
            await this.fileService.deleteFile(m.thumbnailUrl);
          }
        })
      );

      // Delete vet record files
      await Promise.all(
        horse.health.vetRecords.flatMap(r => 
          r.files.map(f => this.fileService.deleteFile(f.url))
        )
      );
    } catch (error) {
      console.error('Error deleting files:', error);
    }

    await this.horseRepository.remove(horse);
  }

  async recordView(horseId: string, userId: string): Promise<void> {
    const horse = await this.findHorseById(horseId);

    // Don't record views from the owner
    if (horse.ownerId === userId) {
      return;
    }

    const existingView = await this.horseViewRepository.findOne({
      where: {
        horse: { id: horseId },
        user: { id: userId }
      }
    });

    if (!existingView) {
      const view = this.horseViewRepository.create({
        horse: { id: horseId },
        user: { id: userId }
      });
      await this.horseViewRepository.save(view);
    }
  }

  private validateBasicInfo(basicInfo: any) {
    if (!basicInfo?.name || !basicInfo?.breed || 
        !basicInfo?.dateOfBirth || !basicInfo?.gender ||
        !basicInfo?.height || !basicInfo?.color) {
      throw new BadRequestException('Incomplete basic information');
    }

    if (!Object.values(HorseGender).includes(basicInfo.gender)) {
      throw new BadRequestException('Invalid gender value');
    }

    if (basicInfo.height < 10 || basicInfo.height > 20) {
      throw new BadRequestException('Invalid height value');
    }
  }

  private validatePerformance(performance: any) {
    if (!performance?.disciplines || !Array.isArray(performance.disciplines) || 
        performance.disciplines.length === 0) {
      throw new BadRequestException('At least one discipline is required');
    }

    if (!Object.values(DisciplineLevel).includes(performance.currentLevel)) {
      throw new BadRequestException('Invalid performance level');
    }
  }

  private validateHealth(health: any) {
    if (!health?.generalHealth) {
      throw new BadRequestException('General health information is required');
    }
  }

  private validateLineage(lineage: any) {
    if (!lineage?.registrationNumber || !lineage?.sire?.name || 
        !lineage?.dam?.name) {
      throw new BadRequestException('Complete lineage information is required');
    }
  }

  private async handleMediaUpdates(existingMedia: any[], newMedia: any[]) {
    // Delete removed media files
    const removedMedia = existingMedia.filter(
      exist => !newMedia.some(newM => newM.url === exist.url)
    );

    await Promise.all(
      removedMedia.map(async (media) => {
        if (media.url) {
          await this.fileService.deleteFile(media.url);
        }
        if (media.thumbnailUrl) {
          await this.fileService.deleteFile(media.thumbnailUrl);
        }
      })
    );

    return newMedia;
  }
}