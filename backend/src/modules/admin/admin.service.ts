import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { Horse } from '../horses/entities/horse.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Horse)
    private horseRepository: Repository<Horse>,
  ) {}

  async getAllUsers(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async createUser(userData: any): Promise<UserEntity> {
    const { password, ...rest } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({ ...rest, passwordHash });
    const savedUser = await this.userRepository.save(newUser);
    return Array.isArray(savedUser) ? savedUser[0] : savedUser;
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: id.toString() } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getAllHorses(): Promise<Horse[]> {
    return this.horseRepository.find();
  }

  async getHorseById(id: string): Promise<Horse> {
    const horse = await this.horseRepository.findOne({ where: { id: id.toString() } });
    if (!horse) {
      throw new NotFoundException(`Horse with ID ${id} not found`);
    }
    return horse;
  }
}