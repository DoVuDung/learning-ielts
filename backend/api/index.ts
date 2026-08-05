import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const expressApp = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );

    app.use(helmet());
    app.use(cookieParser());

    const rawOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]
      .filter(Boolean)
      .join(',');

    const allowedOrigins = new Set(
      rawOrigins
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    );

    app.enableCors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.has(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`), false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  expressApp(req, res);
}
