import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Horse } from './horse.entity';
import { User } from './user.entity';

@Entity('horse_views')
export class HorseView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Horse)
  @JoinColumn({ name: 'horse_id' })
  horse: Horse;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}