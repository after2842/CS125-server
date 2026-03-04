import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { Global } from '@nestjs/common';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
