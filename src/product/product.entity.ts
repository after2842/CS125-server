import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price_min: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price_max: number;

  @Column()
  link: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  merchant?: string;

  @Column({ type: 'text', nullable: true })
  color?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ nullable: true })
  image_url?: string;
}
