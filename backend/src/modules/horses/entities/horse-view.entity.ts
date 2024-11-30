import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Horse } from './horse.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('horse_views')
export class HorseViewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Horse)
  horse!: Horse;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;

  constructor(partial: Partial<HorseViewEntity> = {}) {
    Object.assign(this, partial);
  }
}