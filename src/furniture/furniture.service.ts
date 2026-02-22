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
    const embedding = await this.intentService.embedQuery(title);
    console.log(embedding, 'embedding!');
    const dsl: any = {
      size: 20,
      _source: { exclude: ['title_embedding', 'description_embedding'] },
      query: {
        multi_match: {
          query: title,
          fields: ['title^3', 'description'],
        },

        // hybrid: {
        //   queries: [
        //     {
        //       multi_match: {
        //         query: title,
        //         fields: ['title^3', 'description'],
        //       },
        //     },
        //     {
        //       knn: {
        //         title_embedding: {
        //           vector: embedding,
        //           k: 50,
        //         },
        //       },
        //     },
        //     {
        //       knn: {
        //         description_embedding: {
        //           vector: embedding,
        //           k: 50,
        //         },
        //       },
        //     },
        //   ],
        // },
      },
    };

    const res = await fetch(
      `${process.env.OPENSEARCH_URL}/products_v4/_search`,
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

  async findReview(query: any) {
    console.log('yes');
    const product = query?.product;
    const merchant = query?.merchant;
    return await this.intentService.searchReview(product, merchant);
  }

  async findOne(id: string) {
    console.log('Search endpoint called', id);
    console.log(id, 'queryID');

    const res = await fetch(
      `${process.env.OPENSEARCH_URL}/products_v4/_doc/${id}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!res.ok) {
      console.log(res.status, 'not ok');
      const txt = await res.text();
      throw new Error(`OpenSearch error ${res.status}: ${txt.slice(0, 500)}`);
    }
    const data = await res.json();
    console.log(data, '✅ the specific route param');

    return { id: data._id, ...data._source };
  }
}
