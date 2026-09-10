import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaludPública Sanare API')
    .setDescription(
      'Sistema de Gestión de Turnos para Centros de Salud Públicos. Autenticación JWT, roles (PATIENT/DOCTOR/ADMIN), triaje inteligente e integración de notificaciones.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const publicDir = join(process.cwd(), 'public');
  if (existsSync(publicDir)) {
    app.useStaticAssets(publicDir, { index: false });
    app
      .getHttpAdapter()
      .getInstance()
      .get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(join(publicDir, 'index.html'));
      });
  }

  const port = Number(configService.get<string>('PORT', '3001'));
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API SaludPública en http://localhost:${port}/api`);
}

void bootstrap();