import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 DODAJ TO – pozwala na połączenia z frontendu
  app.enableCors({
    origin: 'http://localhost:5173', // adres twojego frontendu
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
