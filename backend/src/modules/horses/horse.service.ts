import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between, In, Not } from 'typeorm';
import { Horse } from '../../entities/horse.entity';
import { HorseMedia } from '../../entities/horse-media.entity';
import { HorseView } from '../../entities/horse-view.entity';
import { CreateHorseDto, UpdateHorseDto, HorseFilterDto } from './dto/horse.dto';
import { FileUploadService } from '../shared/file-upload.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class HorseService {
  constructor(
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
    @InjectRepository(HorseMedia)
    private readonly horseMediaRepository: Repository<HorseMedia>,
    @InjectRepository(HorseView)
    private readonly horseViewRepository: Repository<HorseView>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async createHorse(userId: string, createHorseDto: CreateHorseDto): Promise<Horse> {
    const horse = this.horseRepository.create({
      ...createHorseDto,
      owner: { id: userId },
      status: 'active'
    });

    return await this.horseRepository.save(horse);
  }

  async updateHorse(horseId: string, userId: string, updateHorseDto: UpdateHorseDto): Promise<Horse> {
    const horse = await this.horseRepository.findOne({
      where: { id: horseId, owner: { id: userId } },
      relations: ['owner']
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    Object.assign(horse, updateHorseDto);
    return await this.horseRepository.save(horse);
  }

  async findHorses(filterDto: HorseFilterDto): Promise<{ horses: Horse[], total: number, page: number, pages: number }> {
    const { page = 1, limit = 20 } = filterDto;
    const skip = (page - 1) * limit;

    const query: FindOptionsWhere<Horse> = {};
    const { search, breeds, disciplines, minHeight, maxHeight, minPrice, maxPrice, status } = filterDto;


    if (search) {
      query.name = ILike(`%${search}%`);
    }

    if (breeds?.length) {
      query.breed = In(breeds);
    }

    if (disciplines?.length) {
      query.discipline = In(disciplines);
    }

    if (minHeight || maxHeight) {
      query.height = Between(minHeight || 0, maxHeight || 999);
    }

    if (status) {
      query.status = status;
    }

    if (minPrice || maxPrice) {
      query.priceRange = {
        min: Between(minPrice || 0, maxPrice || 999999999)
      };
    }

    const [horses, total] = await this.horseRepository.findAndCount({
      where: query,
      relations: ['owner', 'media', 'details'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return { horses, total, page, pages };
  }

  async getHorseById(horseId: string, userId?: string): Promise<Horse> {
    const horse = await this.horseRepository.findOne({
      where: { id: horseId },
      relations: ['owner', 'media', 'details']
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    // Track view if userId is provided and it's not the owner
    if (userId && horse.owner.id !== userId) {
      await this.trackHorseView(horseId, userId);
    }

    return horse;
  }

  async addHorseMedia(
    horseId: string, 
    userId: string, 
    files: Express.Multer.File[], 
    captions: string[]
  ): Promise<HorseMedia[]> {
    const horse = await this.horseRepository.findOne({
      where: { id: horseId, owner: { id: userId } }
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    const media: HorseMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      try {
        const uploadResult = await this.fileUploadService.uploadFile(file);

        const horseMedia = this.horseMediaRepository.create({
          horse,
          url: uploadResult.url,
          mediaType: file.mimetype,
          caption: captions[i],
          orderIndex: i
        });

        media.push(await this.horseMediaRepository.save(horseMedia));
      } catch (error) {
        throw new BadRequestException(`Failed to upload file: ${error.message}`);
      }
    }

    return media;
  }

  async getHorseStatistics(horseId: string): Promise<any> {
    const horse = await this.horseRepository.findOne({
      where: { id: horseId },
      relations: ['deals']
    });

    if (!horse) {
      throw new NotFoundException('Horse not found');
    }

    const [totalViews, viewsByDay] = await Promise.all([
      this.calculateTotalViews(horseId),
      this.calculateViewsByDay(horseId)
    ]);

    const statistics = {
      totalViews,
      totalInquiries: horse.deals.length,
      averageViewsPerDay: viewsByDay,
      listingAge: this.calculateListingAge(horse.createdAt),
      similarHorsePrices: await this.getSimilarHorsePrices(horse),
      viewTrends: await this.getViewTrends(horseId)
    };

    return statistics;
  }

  private async calculateTotalViews(horseId: string): Promise<number> {
    return await this.horseViewRepository.count({
      where: { horse: { id: horseId } }
    });
  }

  private async calculateViewsByDay(horseId: string): Promise<number> {
    const listingAge = await this.horseViewRepository
      .createQueryBuilder('view')
      .where('view.horseId = :horseId', { horseId })
      .select('COUNT(DISTINCT DATE(view.createdAt))', 'days')
      .getRawOne();

    const totalViews = await this.calculateTotalViews(horseId);
    return totalViews / (listingAge.days || 1);
  }

  private async getViewTrends(horseId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await this.horseViewRepository
      .createQueryBuilder('view')
      .where('view.horseId = :horseId', { horseId })
      .andWhere('view.createdAt >= :startDate', { startDate: thirtyDaysAgo })
      .select('DATE(view.createdAt)', 'date')
      .addSelect('COUNT(*)', 'views')
      .groupBy('DATE(view.createdAt)')
      .getRawMany();

    return views;
  }

  private async trackHorseView(horseId: string, userId: string): Promise<void> {
    const view = this.horseViewRepository.create({
      horse: { id: horseId },
      user: { id: userId },
    });

    await this.horseViewRepository.save(view);
  }

  private calculateAveragePrice(horses: Horse[]): number {
    if (!horses.length) return 0;
    
    const validPrices = horses
      .map(horse => horse.priceRange?.min)
      .filter(price => typeof price === 'number');

    if (!validPrices.length) return 0;

    return validPrices.reduce((acc, price) => acc + price, 0) / validPrices.length;
  }

  private calculatePriceRange(horses: Horse[]): { min: number; max: number } {
    const validPrices = horses
      .map(horse => horse.priceRange?.min)
      .filter(price => typeof price === 'number');

    if (!validPrices.length) return { min: 0, max: 0 };

    return {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices)
    };
  }
}
