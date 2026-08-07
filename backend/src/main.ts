import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lớp 1: HTTP Security Headers (Helmet)
  app.use(helmet());

  // Lớp 2: Cookie Parser (để đọc JWT HttpOnly cookie)
  app.use(cookieParser());

  // Lớp 3: Flexible & Secure CORS (Cho phép Frontend web + Admin portal)
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

  // Lớp 4: Global Input Validation & Whitelisting (chống Mass Assignment injection)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Lớp 5: Chuẩn hóa format lỗi RESTful & ẩn internal details
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger / OpenAPI ───────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('BapEnglish API')
    .setDescription(
      'REST API for the BapEnglish IELTS learning platform.\n\n' +
      '**Auth:** All protected routes require a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`). ' +
      'To test in Swagger UI, click Authorize and enter your JWT token.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .addTag('auth', 'Google OAuth 2.0 & session management')
    .addTag('videos', 'YouTube video import & management')
    .addTag('transcript', 'YouTube subtitle fetching')
    .addTag('progress', 'Dictation progress tracking')
    .addTag('words', 'Vocabulary notes & FSRS-5 card review')
    .addTag('speaking', 'AI speaking practice (Anthropic streaming)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
    customSiteTitle: 'BapEnglish API Docs',
  });

  await app.listen(process.env.PORT ?? 3001);

  const port = process.env.PORT ?? 3001;
  console.log(`🚀 Backend running at http://localhost:${port}`);
  console.log(`📚 Swagger UI at    http://localhost:${port}/api/docs`);
}

bootstrap();
