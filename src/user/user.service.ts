import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';
import { Furniture } from '../furniture/furniture.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    @InjectRepository(Furniture)
    private readonly furnitureRepo: Repository<Furniture>,
  ) {}

  async test(sessionId: string) {
    try {
      return { message: 'Test successful' };
    } catch (err: any) {
      // SQLite
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Email already exists');
      }
      // Postgres
      if (err?.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      // MySQL
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already exists');
      }

      throw err;
    }
  }

  private inferAesthetic(item: Furniture): string | null {
    const text =
      `${item.name ?? ''} ${item.short_description ?? ''} ${item.designer ?? ''} ${item.category ?? ''}`.toLowerCase();

    const aestheticKeywords: Record<string, string[]> = {
      modern: ['modern', 'minimal', 'sleek', 'contemporary'],
      scandi: ['scandi', 'scandinavian', 'light wood', 'oak', 'simple'],
      industrial: ['industrial', 'metal', 'steel', 'iron'],
      boho: ['boho', 'bohemian', 'rattan', 'woven', 'bamboo'],
    };

    let bestAesthetic: string | null = null;
    let bestHits = 0;

    for (const [aesthetic, keywords] of Object.entries(aestheticKeywords)) {
      const hits = keywords.filter((k) => text.includes(k)).length;
      if (hits > bestHits) {
        bestHits = hits;
        bestAesthetic = aesthetic;
      }
    }

    return bestHits > 0 ? bestAesthetic : null;
  }

  async recordFurnitureClick(userId: number, furnitureId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const item = await this.furnitureRepo.findOne({ where: { id: furnitureId } });
    if (!item) {
      throw new UnauthorizedException('Furniture item not found');
    }

    const aesthetic = this.inferAesthetic(item);

    if (!aesthetic) {
      return {
        message: 'Click recorded, but no aesthetic could be inferred',
        favoriteAesthetic: user.favoriteAesthetic,
      };
    }

    if (aesthetic === 'modern') user.modernClicks += 1;
    if (aesthetic === 'scandi') user.scandiClicks += 1;
    if (aesthetic === 'industrial') user.industrialClicks += 1;
    if (aesthetic === 'boho') user.bohoClicks += 1;

    const counts = {
      modern: user.modernClicks,
      scandi: user.scandiClicks,
      industrial: user.industrialClicks,
      boho: user.bohoClicks,
    };

    let favoriteAesthetic = 'modern';
    let maxCount = counts.modern;

    for (const [style, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteAesthetic = style;
      }
    }

    user.favoriteAesthetic = favoriteAesthetic;
    await this.userRepo.save(user);

    return {
      message: 'Click recorded successfully',
      clickedAesthetic: aesthetic,
      favoriteAesthetic: user.favoriteAesthetic,
      counts,
    };
  }


}
