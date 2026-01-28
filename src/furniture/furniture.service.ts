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
}
