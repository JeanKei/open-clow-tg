import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);

  console.log('Telegram AI Bot started on port 3000');
  console.log('server is ready for client connections');
}

bootstrap();
