import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    app.enableCors({ origin: '*' });
    await app.listen(3001);
    console.log('🚀 GeoField API running on http://localhost:3001');
}
bootstrap();
