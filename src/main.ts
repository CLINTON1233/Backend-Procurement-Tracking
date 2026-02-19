import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS untuk frontend di port 3003
  app.enableCors({
    origin: ['http://localhost:3003', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Create folder uploads 
  const fs = require('fs');
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // Ubah port ke 4003 (bukan 4000)
  await app.listen(4003);
  console.log(`🚀Server running on http://localhost:4003`);
  console.log(`Uploads folder: ${uploadDir}`);
}
bootstrap();