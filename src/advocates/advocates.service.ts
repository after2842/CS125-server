import { Injectable } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { Advocate } from './advocate.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AdvocatesService {
  constructor(
    @InjectRepository(Advocate)
    private readonly repo: Repository<Advocate>,
  ) {}
  async search({ query = '', page = 1, limit = 10 }) {
    query = query.trim();

    const where = query
      ? [{ name: ILike(`%${query}%`) }, { phone: ILike(`%${query}%`) }]
      : undefined;

    const [items, total] = await this.repo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { id: 'ASC' },
    });

    return { items, total, page, limit };
  }
}
