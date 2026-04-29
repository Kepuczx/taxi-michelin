"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://taxi-michelin.vercel.app',
                'https://taxi-michelin.vercel.app',
                /\.vercel\.app$/,
            ];
            if (!origin) {
                callback(null, true);
            }
            else if (allowedOrigins.some(allowed => typeof allowed === 'string' ? allowed === origin : allowed.test(origin))) {
                callback(null, true);
            }
            else {
                console.log(`❌ CORS blocked origin: ${origin}`);
                callback(null, true);
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
//# sourceMappingURL=main.js.map