import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import{ Redis } from 'ioredis';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}


@Injectable()
export class CacheService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
    });
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.redis.set(key, value, 'EX', expireSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
