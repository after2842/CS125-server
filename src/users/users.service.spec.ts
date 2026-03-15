import * as dotenv from 'dotenv';
dotenv.config();

import { UserService } from './users.service';
import { SupabaseService } from '../supabase/supabase.service';

const AESTHETIC_ARCHETYPES = [
  'minimal', 'classic_polished', 'quiet_luxury', 'romantic_feminine',
  'bohemian', 'preppy', 'streetwear', 'sporty', 'scandi', 'edgy',
  'vintage_retro', 'eclectic_maximalist',
];

const LIFESTYLE_OCCASIONS = [
  'everyday_casual', 'work_office', 'date_night', 'cocktail_party',
  'wedding_guest', 'vacation_resort', 'brunch_social', 'festival_event',
  'active_outdoor', 'formal_event',
];

const COLOR_PATTERN_AFFINITIES = [
  'neutral', 'monochrome', 'earthy', 'pastel', 'jewel_toned',
  'vivid_bright', 'solid_minimal', 'stripe_check_geometric',
  'floral_botanical', 'animal_print',
];

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    const supabaseService = new SupabaseService();
    supabaseService.onModuleInit();

    const mockRepo = {} as any;
    userService = new UserService(mockRepo, supabaseService);
  });

  describe('analyzePreferenceWithNova', () => {
    it(
      'should return structured preferences and write to DB',
      async () => {
        const result = await userService.analyzePreferenceWithNova(
          'abd0df31-314d-4ac9-b54c-ee113ed6c982',
        );

        console.log('Nova result:', JSON.stringify(result, null, 2));

        // Structured enum fields
        expect(AESTHETIC_ARCHETYPES).toContain(result.aesthetic_archetype);
        expect(LIFESTYLE_OCCASIONS).toContain(result.lifestyle_occasion);
        expect(COLOR_PATTERN_AFFINITIES).toContain(result.color_pattern_affinity);

        // Per-image output
        expect(Array.isArray(result.images)).toBe(true);
        expect(result.images.length).toBeGreaterThan(0);

        // Exactly one featured image
        const featured = result.images.filter((img: any) => img.is_featured);
        expect(featured.length).toBe(1);

        // Each image has required fields
        for (const img of result.images) {
          expect(img.url).toBeDefined();
          expect(typeof img.short_summary).toBe('string');
          expect(typeof img.is_featured).toBe('boolean');
        }
      },
      90_000,
    );
  });
});
