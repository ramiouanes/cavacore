import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HorseService } from './horse.service';
import { CreateHorseDto, UpdateHorseDto, HorseFilterDto } from './dto/horse.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('horses')
export class HorseController {
  constructor(private readonly horseService: HorseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createHorse(
    @Request() req,
    @Body() createHorseDto: CreateHorseDto
  ) {
    return await this.horseService.createHorse(req.user.id, createHorseDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateHorse(
    @Request() req,
    @Param('id') id: string,
    @Body() updateHorseDto: UpdateHorseDto
  ) {
    return await this.horseService.updateHorse(id, req.user.id, updateHorseDto);
  }

  @Get()
  async findHorses(@Query() filterDto: HorseFilterDto) {
    return await this.horseService.findHorses(filterDto);
  }

  @Get(':id')
  async getHorse(@Param('id') id: string) {
    return await this.horseService.getHorseById(id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async addHorseMedia(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('captions') captions: string[]
  ) {
    return await this.horseService.addHorseMedia(id, req.user.id, files, captions);
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard)
  async getHorseStatistics(@Param('id') id: string) {
    return await this.horseService.getHorseStatistics(id);
  }
}
