// backend/src/modules/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VerificationStatus } from '../enums/verification-status.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  passwordHash!: string;

  @Column({ nullable: true, type: 'varchar' })
  verificationToken?: string | null;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  verificationStatus!: VerificationStatus;

  @Column({ default: 'user' })
  role!: string;

  constructor(partial: Partial<UserEntity> = {}) {
    Object.assign(this, partial);
  }
}