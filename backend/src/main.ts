import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

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
