import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value));
      if (ttl) {
        await this.redis.expire(key, ttl);
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      throw error;
    }
  }
}