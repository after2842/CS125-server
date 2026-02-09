// play-back/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdvocatesModule } from './advocates/advocates.module';
import { FurnitureModule } from './furniture/furniture.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite', // or "sqlite"
      // host: 'localhost',
      // port: 5432,
      // username: 'postgres',
      // password: 'postgres',
      database: 'play.db',
      autoLoadEntities: true, //
      synchronize: true, //
    }),
    AdvocatesModule,
    AuthModule,
    FurnitureModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
