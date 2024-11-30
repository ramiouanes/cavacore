import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { EventCategory } from '../dto/event.dto';

@Entity('local_events')
export class LocalEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone' })
  endDate: Date;

  @Column({ type: 'jsonb' })
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };

  @Column({
    type: 'enum',
    enum: EventCategory,
    default: EventCategory.OTHER
  })
  category: EventCategory;

  @Column({ nullable: true })
  url: string;

  @Column({ name: 'organizer_name' })
  organizerName: string;

  @Column({ name: 'organizer_email', nullable: true })
  organizerEmail: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  price: {
    amount: number;
    currency: string;
  };

  @Column({ default: false })
  approved: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  creator: UserEntity;
}
