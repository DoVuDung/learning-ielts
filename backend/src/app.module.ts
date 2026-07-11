import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { VideosModule } from './videos/videos.module';
import { TranscriptModule } from './transcript/transcript.module';
import { ProgressModule } from './progress/progress.module';
import { WordsModule } from './words/words.module';
import { SpeakingModule } from './speaking/speaking.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // max 100 requests per minute per IP
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    VideosModule,
    TranscriptModule,
    ProgressModule,
    WordsModule,
    SpeakingModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
