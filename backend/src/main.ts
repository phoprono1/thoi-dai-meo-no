import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
  });

  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log(`🐱💣 Mèo Nổ Backend đang chạy tại http://localhost:${port}`);
}
bootstrap();
