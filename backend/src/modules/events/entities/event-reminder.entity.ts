import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('event_reminders')
export class EventReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_source_id' })
  eventSourceId: string;

  @Column({ name: 'event_source' })
  eventSource: string;

  @Column({ name: 'reminder_date', type: 'timestamp with time zone' })
  reminderDate: Date;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'jsonb', name: 'event_details' })
  eventDetails: {
    title: string;
    startDate: Date;
    endDate: Date;
    location: {
      address: string;
      latitude: number;
      longitude: number;
    };
  };

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
