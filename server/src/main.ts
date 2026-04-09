import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

    // SEC-02: Restrict CORS to known origins only; never use wildcard in production
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:5173', 'http://localhost:4173'];
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // SEC-03: Global validation pipe — strips unknown/extra properties (prevents mass-assignment)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,          // remove properties not in DTO
        forbidNonWhitelisted: false, // don't throw on extras (graceful for MVP)
        transform: true,          // auto-transform payloads to DTO instances
        transformOptions: {
            enableImplicitConversion: true, // converts query params to correct types
        },
    }));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await app.listen(port);
    console.log(`🚀 GeoField API running on http://localhost:${port}`);
}
bootstrap();
