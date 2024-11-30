import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { VerificationStatus } from './enums/verification-status.enum';
import { AddParticipantDto } from '../deals/dto/deal.dto';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findOrCreateUser(addParticipantDto: AddParticipantDto): Promise<UserEntity> {
    let user = await this.findById(addParticipantDto.userId);
    
    if (!user.email) {
      user = this.userRepository.create({
        id: uuidv4(),
        firstName: addParticipantDto.firstName,
        lastName: addParticipantDto.lastName,
        email: addParticipantDto.email.toLowerCase(),
        role: 'user',
        verificationStatus: VerificationStatus.PENDING
      });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id }
    });
    if (!user) {
      let empty_user = new UserEntity();
      return empty_user;
    }
    return user;
  }

  async createBasicUser(email: string): Promise<UserEntity> {
    const user = this.userRepository.create({
      id: uuidv4(),
      email: email.toLowerCase(),
      role: 'user',
      verificationStatus: VerificationStatus.PENDING
    });
    return await this.userRepository.save(user);
  }
}