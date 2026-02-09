import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisStore } from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // frontend asks/preflight => do you accept this origin? => yes we do!
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Parse cookies so session middleware can read sid cookie reliably
  app.use(cookieParser());

  // Connect Redis
  const redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();

  // Create Redis session store
  // Explain how to use Redis server => through redisClient!
  // how to search ? use key, sess!
  // when it goes to the middleware => now the express know how to talk to Redis
  const store = new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  });

  ///////////////////////////////////////////////////////////////////////////
  // this is the middleware config
  // Session middleware (this is what reads/writes Redis)
  // app.use handle the request BEFORE and AFTER the bsuiness logic
  // express middleware creates a JS object session either uninitialized/ read from Redis after lookup
  // then hand it to the business logic/controller

  // when/how to create the req.session JS object

  // where to load/save it (Redis store)

  // how to issue the cookie to the browser

  // when to persist changes
  //////////////////////////////////////////////////////////////////////////////////
  app.use(
    session({
      name: 'sid', // cookie name
      store,
      secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
      resave: false,
      saveUninitialized: false, // only write when you set something
      rolling: true, // optional: refresh cookie expiration on each request
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // set true in HTTPS production
        maxAge: 1000 * 60 * 60 * 24 * 1, // 1s days
      },
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, 'localhost');
}
bootstrap();
