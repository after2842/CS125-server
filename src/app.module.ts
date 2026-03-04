// play-back/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ProductModule } from './product/product.module';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL;
console.log(supabaseDirectUrl);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get('SUPABASE_DIRECT_URL');
        console.log('Connecting to DB with URL:', url);
        return {
          type: 'postgres',
          url: configService.get('SUPABASE_DIRECT_URL'),
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    AuthModule,
    ProductModule,
    UserModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
