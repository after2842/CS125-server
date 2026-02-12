import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Furniture } from './furniture.entity';

@Injectable()
export class FurnitureService {
  constructor(
    @InjectRepository(Furniture)
    private readonly repo: Repository<Furniture>,
  ) {}

  async search({ query = '', category = '', page = 1, limit = 10 }) {
    query = query.trim();

    const where: any = [];

    if (query && category) {
      // Search by query AND category
      where.push(
        { name: ILike(`%${query}%`), category: ILike(`%${category}%`) },
        { designer: ILike(`%${query}%`), category: ILike(`%${category}%`) },
      );
    } else if (query) {
      // Search by query only
      where.push(
        { name: ILike(`%${query}%`) },
        { designer: ILike(`%${query}%`) },
      );
    } else if (category) {
      // Filter by category only
      where.push({ category: ILike(`%${category}%`) });
    }

    const [items, total] = await this.repo.findAndCount({
      where: where.length > 0 ? where : undefined,
      take: limit,
      skip: (page - 1) * limit,
      order: { id: 'ASC' },
    });

    return { items, total, page, limit };
  }

  async findAll() {
    console.log('yes');
    return await this.repo.find({
      take: 20,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    return await this.repo.findOne({ where: { id } });
  }

  async recommend({ preferences, context, limit = 10 }) {
    const items = await this.repo.find();

    const scored = items.map((item) => {
      let score = 0;
      const why: string[] = [];

      const type = context?.type?.toLowerCase(); // "sofa" | "chair" | "bed" | "lighting"
      const aesthetic = context?.aesthetic?.toLowerCase(); // "modern" | "scandi" | "industrial" | "boho"
      const roomWidth = Number(context?.roomWidth); // user room width
      const maxBudget = Number(preferences?.maxBudget);

      // Budget preference
      if (!Number.isNaN(maxBudget) && maxBudget > 0) {
        const price = Number(item.price);
        if (!Number.isNaN(price) && price <= maxBudget) {
          score += 1.0;
          why.push('Within budget');
        } else if (!Number.isNaN(price)) {
          score -= Math.min(1.0, (price - maxBudget) / maxBudget);
          why.push('Over budget');
        }
      }

      // Category/type
      const typeToCategories: Record<string, string[]> = {
        sofa: ['sofa', 'seating', 'couch'],
        chair: ['chair', 'seating'],
        bed: ['bed'],
        lighting: ['light', 'lighting', 'lamp'],
      };

      if (type && item.category) {
        const cat = item.category.toLowerCase();
        const needles = typeToCategories[type] ?? [];
        const match = needles.some((n) => cat.includes(n));
        if (match) {
          score += 1.2;
          why.push(`Matches ${type} category`);
        } else {
          score -= 0.4;
        }
      }

      // Sizing check
      if (!Number.isNaN(roomWidth) && roomWidth > 0 && item.width != null) {
        const w = Number(item.width);
        if (!Number.isNaN(w)) {
          if (w <= roomWidth) {
            score += 0.6;
            why.push('Fits room width');
          } else {
            score -= 0.8;
            why.push('Too wide for room');
          }
        }
      }

      // Aesthetic ranking
      const aestheticKeywords: Record<string, string[]> = {
        modern: ['modern', 'minimal', 'sleek', 'contemporary'],
        scandi: ['scandi', 'scandinavian', 'light wood', 'oak', 'simple'],
        industrial: ['industrial', 'metal', 'steel', 'iron'],
        boho: ['boho', 'bohemian', 'rattan', 'woven', 'bamboo'],
      };

      if (aesthetic) {
        const text =
          `${item.name ?? ''} ${item.short_description ?? ''} ${item.designer ?? ''} ${item.category ?? ''}`.toLowerCase();

        const kws = aestheticKeywords[aesthetic] ?? [];
        const hits = kws.filter((k) => text.includes(k)).length;

        if (hits > 0) {
          score += 0.2 * hits;
          why.push(`Matches ${aesthetic} aesthetic`);
        }
      } 

      return { item, score, why };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

}
