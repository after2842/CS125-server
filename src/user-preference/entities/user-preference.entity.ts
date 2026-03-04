import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/users.entity';

@Entity()
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  summary: string[];

  @Column()
  aesthetic_archetypes: string[];

  @Column()
  lifestyle_and_occasion: string[];

  @Column()
  color_and_pattern_affinity: string[];

  // This creates the relationship and the foreign key
  @OneToOne(() => Users)
  @JoinColumn() // This decorator creates the userId column in the database
  user: Users;
}
