import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Furniture } from './furniture.entity';
import { IntentService } from '../search/intent.service';
@Injectable()
export class FurnitureService {
  constructor(
    @InjectRepository(Furniture)
    private readonly repo: Repository<Furniture>,
    private readonly intentService: IntentService,
  ) {}

  async search(query: any) {
    console.log('Search endpoint called', query);
    const title = query?.title.trim();
    const length = query?.length;
    console.log(title, length, 'query');

    const dsl: any = {
      _source: [
        'title',
        'description',
        'url',
        'image_urls',
        'price_min',
        'price_max',
      ],
      query: {
        bool: {
          must: [
            {
              match: {
                title: {
                  query: title,
                  operator: 'and', // ensures all words appear in title
                },
              },
            },
          ],
          filter: [],
        },
      },
    };

    const res = await fetch(
      `${process.env.OPENSEARCH_URL}/products_v1/_search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dsl),
      },
    );
    if (!res.ok) {
      console.log(res.status, 'not ok');
      const txt = await res.text();
      throw new Error(`OpenSearch error ${res.status}: ${txt.slice(0, 500)}`);
    }
    const data = await res.json();

    return data.hits.hits.map((h: any) => ({
      id: h._id,
      score: h._score,
      ...h._source,
    }));

    // return await this.intentService.toSearchIntent(query);
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
