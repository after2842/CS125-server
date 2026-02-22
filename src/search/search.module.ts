import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  providers: [IntentService],
  exports: [IntentService],
})
export class SearchModule {}
