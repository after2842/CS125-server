import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { ConflictException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import * as bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UserService {
  private s3Client: S3Client;
  private readonly bucketName = 'furnfitdemo';

  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly supabaseService: SupabaseService,
  ) {
    this.s3Client = new S3Client({ region: 'us-west-2' });
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  private async uploadToS3(
    imageBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    console.log(`📤 [S3 Upload] Starting upload...`);
    console.log(`   Bucket: ${this.bucketName}`);
    console.log(`   Key: ${filename}`);
    console.log(`   Buffer size: ${imageBuffer.length} bytes`);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
    });

    try {
      const result = await this.s3Client.send(command);
      console.log(`✅ [S3 Upload] Success!`);
      console.log(`   ETag: ${result.ETag}`);
    } catch (error) {
      console.error(`❌ [S3 Upload] Failed!`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }

    // Return public URL
    const url = `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
    console.log(`   URL: ${url}`);
    return url;
  }

  async uploadUserProfileImages(
    userId: string,
    imageUrls: string[],
  ): Promise<string[]> {
    console.log(`\n🖼️  [Profile Images] Starting upload for user: ${userId}`);
    console.log(`   Total images to process: ${imageUrls.length}`);

    const uploadedUrls: string[] = [];
    const supabase = this.supabaseService.getClient();

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`\n📷 [Image ${i + 1}/${imageUrls.length}] Processing...`);
      console.log(`   Source URL: ${imageUrl.substring(0, 80)}...`);

      try {
        // 1. Download image from Instagram
        console.log(`   ⬇️  Downloading image...`);
        const imageBuffer = await this.downloadImage(imageUrl);
        console.log(`   ✅ Downloaded: ${imageBuffer.length} bytes`);

        // 2. Generate unique filename and upload to S3
        const filename = `profile-images/${userId}/${randomUUID()}.jpg`;
        const s3Url = await this.uploadToS3(imageBuffer, filename);

        // 3. Save URL to Supabase
        console.log(`   💾 Saving to Supabase...`);
        const { error } = await supabase.from('users_profile_images').insert({
          users_id: userId,
          url: s3Url,
        });

        if (error) {
          console.error(`   ❌ Supabase insert error:`, error);
          continue;
        }
        console.log(`   ✅ Saved to Supabase`);

        uploadedUrls.push(s3Url);
      } catch (error) {
        console.error(`   ❌ Failed to upload image: ${error.message}`);
        continue;
      }
    }

    console.log(`\n🎉 [Profile Images] Complete!`);
    console.log(
      `   Successfully uploaded: ${uploadedUrls.length}/${imageUrls.length}`,
    );

    return uploadedUrls;
  }

  async retrieveIG(query: any, userId: string) {
    console.log('retrieve IG called', query?.usrname);
    const usrId = query?.usrname;
    const TOKEN = process.env.APIFY_TOKEN;
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${TOKEN}&wait=60`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${usrId}/`],
          resultsLimit: 10,
        }),
      },
    );

    const data = await response.json();
    console.log(data);

    // Extract all image URLs from posts and upload to S3
    const allImageUrls = data.flatMap((post: any) => post.images || []);

    let uploadedUrls: string[] = [];
    if (allImageUrls.length > 0 && userId) {
      uploadedUrls = await this.uploadUserProfileImages(userId, allImageUrls);

      // Update users.is_connected = true after successful upload
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase
        .from('users')
        .update({ is_connected: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to update is_connected:', error);
      } else {
        console.log('✅ Updated users.is_connected = true');
      }
    }

    // Return generic success response
    return {
      success: true,
      message: 'Images uploaded successfully',
      count: uploadedUrls.length,
    };
  }

  async analyzeStyle(posts: any) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });
    let globalImageIndex = 0;
    const imageMetaData = posts
      .flatMap((post, postIdx) =>
        post.images.map((img) => {
          const metadata = `Image ${globalImageIndex}'s metadata: \nID: ${post.id} \nshortCode ${post.shortCode} \nPostedTime: ${post.timestamp}\n\n`;
          globalImageIndex++;
          return metadata;
        }),
      )
      .join('');
    const images = posts.flatMap((post) => post.images);
    const imageObjects = images.map((url) => ({
      type: 'input_image',
      image_url: url,
    }));
    // 1) Define a small, robust schema
    const Score01 = z
      .number()
      .min(0)
      .max(1)
      .describe('A score from 0.0 to 1.0 inclusive.');

    const EvidenceItem = z.object({
      post_shortcode: z
        .string()
        .describe('Instagram post shortCode (e.g., C2EJ4MxrHzd).'),
      excerpt: z
        .string()
        .max(240)
        .describe('Short snippet supporting the claim.'),
    });

    const ScoredClaim = z.object({
      label: z
        .string()
        .describe(
          'A short name for the trait being scored (snake_case recommended).',
        ),
      score: Score01.describe('How strongly the trait appears.'),
      confidence: Score01.describe(
        'How confident the model is, based on evidence.',
      ),
      evidence_refs: z
        .array(z.string())
        .describe(
          'List of EvidenceItem.ref_id values that support this claim.',
        ),
    });

    const InstagramStyleProfile = z.object({
      username: z.string().describe('The Instagram username being analyzed.'),
      summary: z
        .string()
        .describe("2-3 sentence summary of the user's style and vibe."),
      aesthetic_archetypes: z
        .array(ScoredClaim)
        .describe('Core fashion archetypes/subcultures with scores.'),
      lifestyle_and_occasion: z
        .array(ScoredClaim)
        .describe(
          'Occasion/lifestyle signals inferred from captions/comments/alt.',
        ),
      color_and_pattern_affinity: z
        .array(ScoredClaim)
        .describe(
          "Color/pattern preferences (avoid pixel claims if you didn't analyze pixels).",
        ),
      evidence_index: z
        .array(EvidenceItem)
        .min(1)
        .describe('All evidence items referenced by evidence_refs.'),
      overall_confidence: Score01.describe(
        'Overall confidence in this profile.',
      ),
      missing_data: z
        .array(z.string())
        .describe(
          "What you'd need next to improve accuracy (e.g., pixel analysis, brand tags).",
        ),
    });

    // 2) Call Responses API with Structured Outputs

    const response = await openai.responses.parse({
      model: 'gpt-5-mini-2025-08-07',
      input: [
        {
          role: 'system',
          content: [
            "You extract a user's style preferences from Instagram post metadata.",
            'Use images primarily, and use timestamp as reference.',
            'If information is missing, keep scores low and add a note in missing_data.',
            'Every ScoredClaim must reference evidence_index via evidence_refs.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'The order of images and imageMetaData are the same\n\n' +
                imageMetaData,
            },
            ...imageObjects,
          ],
        },
      ],
      text: {
        format: zodTextFormat(InstagramStyleProfile, 'instagram_style_profile'),
      },
    });

    console.log(response.output_parsed);
    // Parsed & validated output
    return response.output_parsed;

    // Example usage
    // const profile = await extractStyleProfile(postsArrayYouShared, "el0lse");
    // console.log(profile);
  }
  async getUserProfileImages(userId: string): Promise<string[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users_profile_images')
      .select('url')
      .eq('users_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row: { url: string }) => row.url);
  }

  async history() {
    const exampleHistory = [
      {
        id: '8a9a5db2c1feba2be7564897490e4f6f724dd0e9',
        score: 24.553026,
        description:
          "There's nothing like bold hemlines and a soft touch. Featuring a deep V neckline, padded shoulders and ruching above a thigh-high front slit, our Love Sex Magic Velvet Dress is way too sexy to stay in the closet.Available in Wine and Hunter Green Deep V Thigh High Front Slit Shoulder Pads Ruching Detail Maxi Length Self 93% Polyester 7% Spandex Imported Available In Plus Sizes California Proposition 65WARNING: Cancer and Reproductive Harm - www.P65Warnings.ca.gov.",
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-274.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-278.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-286.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-282.jpg?v=1571438195',
        ],
        handle: 'love-sex-magic-velvet-dress-hunter',
        title: 'Love Sex Magic Velvet Dress - Hunter',
        price_min: 15.98,
        featured_image: {
          altText: null,
          width: 2523,
          url: 'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-274.jpg?v=1571438195',
          height: 3784,
        },
        product_gid: 'gid://shopify/Product/10019894353',
        url: 'https://www.fashionnova.com/products/love-sex-magic-velvet-dress-hunter',
        tags: [
          '60sale',
          'bottom_length:Maxi',
          'category:Dresses',
          'category_es:Vestidos',
          'color:Hunter',
          'color_fam:Green',
          'ColorFam-Green',
          'default_collection_id:180828100',
          'detail:High Slit',
          'detail:Slit',
          'detail_es:Abertura',
          'detail_es:Abertura Alta',
          'Dresses',
          'fabric:Velvet',
          'fabric_es:Terciopelo',
          'figure:Plus',
          'final sale',
          'Formal',
          'Glam',
          'includedinpromo',
          'JRMODELHEIGHT-FT-5-IN-3',
          'Last Chance',
          'Maxi',
          'neckline:V-Neck',
          'neckline_es:Cuello En V',
          'occasion:Prom & Homecoming',
          'occasion_es:Baile De Graduación',
          'Plus',
          'print:Solid',
          'print_es:Estampado Sólido',
          'prop65-true',
          'Sale',
          'sleeve:Long Sleeve',
          'sleeve_es:Manga Larga',
          'WOMENS',
          'YGroup_AR082016',
        ],
        updated_at: '2026-02-10T23:00:42Z',
        indexed_at: '2026-02-18T09:04:05Z',
        store_domain: 'www.fashionnova.com',
        currency: 'USD',
        price_max: 15.98,
      },
      {
        id: '9e763f18ec7134e64d2f0dbf27dd14051ad364d9',
        score: 24.553026,
        description:
          'you need some constructive criticism. This baby tee has cap sleeves, a cropped fit, and text graphics printed across the chest.',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/hPYZngHtUC7dvOECoMeFhTjyLFOFslJp-24.jpg?v=1682744248',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/3lL0PXrwOXcGeGUYQwT6M0ThqbacA9ps-24.jpg?v=1682744249',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/rNzj8huyVVhg2BjZkfcQZruQbkuSMs62-24.jpg?v=1651783506',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/Cdjboigx1GE1pHFqgdT3TRnA7HUMCYC9-24.jpg?v=1651783506',
        ],
        handle: 'the-sex-was-bad-graphic-tee',
        title: 'The Sex Was Bad Graphic Tee',
        price_min: 50,
        featured_image: {
          altText: 'base',
          width: 843,
          url: 'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/hPYZngHtUC7dvOECoMeFhTjyLFOFslJp-24.jpg?v=1682744248',
          height: 1200,
        },
        product_gid: 'gid://shopify/Product/7640280236289',
        url: 'https://www.dollskill.com/products/the-sex-was-bad-graphic-tee',
        tags: [
          '[color:yellow]color_family:yellow--7640280236289',
          'algolia-ignore',
          'amazon_color:YELLOW',
          'category:Clothing',
          'color:YELLOW',
          'digital',
          'discounteligible',
          'exclude_rebuy',
          'fullprice',
          'launch_date:2/21/2022',
          'launchdate:2/21/2022',
          'main:efe0bd2c212eceec598c42a15b8cd07f',
          'micro:988f0f46dc0a1b862f17028987d2d399',
          'microcategory:Graphic T-Shirt',
          'parentId:259869',
          'regprice',
          'sale:pinksale',
          'sub2:044914add4ae99b6f7e510443478f9a8',
          'sub:11087d84f70335d1fec3aa9e72c8b1d5',
          'subcategory2:Graphic Tees',
          'subcategory:Tops',
          'trend:None',
          'YCRF_clothing_tops',
        ],
        updated_at: '2026-02-13T23:20:43Z',
        indexed_at: '2026-02-18T09:37:29Z',
        store_domain: 'www.dollskill.com',
        currency: 'USD',
        price_max: 50,
      },
      {
        id: 'ecebac762bcedda9971b7ac75f48f1373598270e',
        score: 24.553026,
        description:
          "Be dazzled with the latest hair craze, a sparkle logo clip. This accessory is one to top all your outfits off with it's silver diamante sex logo. The 90's hair slide has made a bold return!",
        image_urls: [
          'https://cdn.shopify.com/s/files/1/1444/3082/products/SOLINA-UNITARD-FIRE-MESH-21741.jpg?v=1571440766',
        ],
        handle: 'hair-clip-w-sex-logo',
        title: 'Hair Clip with Silver Sex Logo',
        price_min: 6,
        featured_image: {
          altText: 'Image of Hair Clip with Silver Sex Logo',
          width: 870,
          url: 'https://cdn.shopify.com/s/files/1/1444/3082/products/SOLINA-UNITARD-FIRE-MESH-21741.jpg?v=1571440766',
          height: 1100,
        },
        product_gid: 'gid://shopify/Product/2471674314865',
        url: 'https://www.motelrocks.com/products/hair-clip-w-sex-logo',
        tags: [
          'accessory',
          'diamante',
          'diamond',
          'festival',
          'festival wear',
          'grip',
          'hair accessory',
          'HAIR CLIP W/ SEX LOGO',
          'hair grip',
          'hair slide',
          'live',
          'logo hair slide',
          'ONE SIZE',
          'related: hair-clip-w-girls-logo',
          'related: hair-clip-w-heaven-logo',
          'related: hair-clip-w-smiley-face',
          'SEARCHANISE_IGNORE',
          'sex slide',
          'silver',
          'slide',
          'sparkle',
        ],
        updated_at: '2025-12-22T13:20:30Z',
        indexed_at: '2026-02-18T09:25:48Z',
        store_domain: 'motelrocks.com',
        currency: 'GBP',
        price_max: 6,
      },
      {
        id: '3664f56e99f948a6e1a42487a71125d0d4b58c1f',
        score: 24.553026,
        description:
          'switching the positions for you! These dice glow in the dark and have graphics of sex positions.',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/ua8cvyqhCRmgO5YZiLXDi5R90h0bmEzH-24.jpg?v=1682864955',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/iwh565q8CpXE7KKImGpCv8W9QP9aAOoP-24.jpg?v=1682864956',
        ],
        handle: 'glow-in-the-dark-sex-dice',
        title: 'Glow In The Dark Sex Dice',
        price_min: 10,
        featured_image: {
          altText: 'base',
          width: 843,
          url: 'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/ua8cvyqhCRmgO5YZiLXDi5R90h0bmEzH-24.jpg?v=1682864955',
          height: 1200,
        },
        product_gid: 'gid://shopify/Product/7671777755393',
        url: 'https://www.dollskill.com/products/glow-in-the-dark-sex-dice',
        tags: [
          '[color:rainbow]color_family:rainbow--7671777755393',
          'algolia-ignore',
          'amazon_color:MULTI',
          'bq1',
          'category:Accessories',
          'color:MULTI',
          'color:RAINBOW',
          'digital',
          'discounteligible',
          'exclude_rebuy',
          'fullprice',
          'launch_date:1/5/2021',
          'launchdate:1/5/2021',
          'main:98edb85b00d9527ad5acebe451b3fae6',
          'parentId:213188',
          'SALESUMMER',
          'sub2:66d0af2d5da0109dc2aae67829f7d4d4',
          'sub:7b3bac443b079338bdfc69e461b83cdc',
          'subcategory2:Toys',
          'subcategory:Other Shit',
          'trend:VDay 2021',
          'YCRF_accessories',
        ],
        updated_at: '2026-02-14T07:24:51Z',
        indexed_at: '2026-02-18T09:42:04Z',
        store_domain: 'www.dollskill.com',
        currency: 'USD',
        price_max: 10,
      },
      {
        id: 'f544e2339992e2ee4eeb172eed0ebb65b700d41a',
        score: 22.956072,
        description: 'Crop top product description',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-pale-pink-front-66d874b83db2e.jpg?v=1725461709',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-hazy-pink-front-66d874b83f800.jpg?v=1725461711',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-bubblegum-front-66d874b83fa70.jpg?v=1725461713',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-athletic-heather-front-66d874b83ff2a.jpg?v=1725461715',
        ],
        handle: 'apple-orchards-and-lesbian-sex-crop-top',
        title: 'Apple Orchards and Lesbian Sex crop top',
        price_min: 29.95,
        featured_image: {
          altText: null,
          width: 2000,
          url: 'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-pale-pink-front-66d874b83db2e.jpg?v=1725461709',
          height: 2000,
        },
        product_gid: 'gid://shopify/Product/7614295638068',
        url: 'https://gotfunnymerch.com/products/apple-orchards-and-lesbian-sex-crop-top',
        tags: ['Crop Top', 'Halloween', 'Pride'],
        updated_at: '2026-01-13T05:03:27Z',
        indexed_at: '2026-02-18T09:22:10Z',
        store_domain: 'gotfunnymerch.com',
        currency: 'USD',
        price_max: 29.95,
      },
      {
        id: 'e41324b5e3237538faec2ef1b8bd082ae87ac0ae',
        score: 22.956072,
        description:
          'A sturdy and warm sweatshirt bound to keep you warm in the colder months. A pre-shrunk, classic fit sweater that’s made with air-jet spun yarn for a soft feel. • 50% cotton, 50% polyester • Pre-shrunk • Classic fit • 1x1 athletic rib knit collar with spandex • Air-jet spun yarn with a soft feel • Double-needle stitched collar, shoulders, armholes, cuffs, and hemSize guide LENGTH (inches) WIDTH (inches) S 27 20 M 28 22 L 29 24 XL 30 26 2XL 31 28 3XL 32 30 4XL 33 32 5XL 34 34 LENGTH (cm) WIDTH (cm) S 68.6 50.8 M 71.1 55.9 L 73.7 61 XL 76.2 66 2XL 78.7 71.1 3XL 81.3 76.2 4XL 83.8 81.3 5XL 86.4 86.4',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sand-front-66d8751c7eba1.jpg?v=1725461807',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-light-blue-front-66d8751c814c3.jpg?v=1725461809',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sport-grey-front-66d8751c81e51.jpg?v=1725461811',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-light-pink-front-66d8751c83621.jpg?v=1725461813',
        ],
        handle: 'apple-orchards-and-lesbian-sex-unisex-sweatshirt',
        title: 'Apple Orchards and Lesbian Sex Unisex Sweatshirt',
        price_min: 37.95,
        featured_image: {
          altText: null,
          width: 2000,
          url: 'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sand-front-66d8751c7eba1.jpg?v=1725461807',
          height: 2000,
        },
        product_gid: 'gid://shopify/Product/7614295867444',
        url: 'https://gotfunnymerch.com/products/apple-orchards-and-lesbian-sex-unisex-sweatshirt',
        tags: ['Halloween', 'Pride', 'Sweater', 'Thanksgiving'],
        updated_at: '2025-12-28T12:08:07Z',
        indexed_at: '2026-02-18T09:22:10Z',
        store_domain: 'gotfunnymerch.com',
        currency: 'USD',
        price_max: 37.95,
      },
    ];
    try {
      return exampleHistory;
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
}
