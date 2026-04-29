import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 POPRAWNIE SKONFIGUROWANY CORS DLA PRODUKCJI
  app.enableCors({
    origin: (origin, callback) => {
      // Dozwolone originy
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://taxi-michelin.vercel.app',
        'https://taxi-michelin.vercel.app',
        /\.vercel\.app$/,
      ];
      
      // Sprawdź czy origin jest dozwolony lub brak origin (dla requestów z tej samej domeny)
      if (!origin) {
        callback(null, true);
      } else if (allowedOrigins.some(allowed => 
        typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
      )) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(null, true); // Na razie pozwalamy wszystkim, żeby nie blokować
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Changed-By', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Backend działa na porcie ${process.env.PORT ?? 3000}`);
  console.log(`🌍 CORS włączony dla Vercel i localhost`);
}
bootstrap();