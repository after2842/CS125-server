import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  favoriteAesthetic: string;

  @Column({ default: 0 })
  modernClicks: number;

  @Column({ default: 0 })
  scandiClicks: number;

  @Column({ default: 0 })
  industrialClicks: number;

  @Column({ default: 0 })
  bohoClicks: number;
}
