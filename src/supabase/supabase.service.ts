import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_PROJ_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing SUPABASE_PROJ_URL or SUPABASE_SERVICE_ROLE in environment variables',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);
    if (error) throw error;
    return { message: 'Signed out successfully' };
  }

  async getUser(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error) throw error;
    return data.user;
  }

  async resetPassword(email: string) {
    const { data, error } =
      await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }

  async verifyOtp(email: string, token: string, type: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email: email,
      token: token, // not number, surprisingly
      type: 'email',
    });

    if (error) throw error;
    return data;
  }
  async getUserById(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return data;
  }
}
