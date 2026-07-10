import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { VideosModule } from './videos/videos.module';
import { TranscriptModule } from './transcript/transcript.module';
import { ProgressModule } from './progress/progress.module';
import { WordsModule } from './words/words.module';
import { SpeakingModule } from './speaking/speaking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    VideosModule,
    TranscriptModule,
    ProgressModule,
    WordsModule,
    SpeakingModule,
  ],
})
export class AppModule {}
