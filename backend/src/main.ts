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

  // Lớp 3: Strict CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
      '**Auth:** All protected routes require an `access_token` HttpOnly cookie ' +
      '(set automatically after Google OAuth login). ' +
      'To test in Swagger UI, first visit `/auth/google` in the browser to log in, ' +
      'then return here — the cookie will be sent automatically.',
    )
    .setVersion('1.0')
    .addCookieAuth('access_token')
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
