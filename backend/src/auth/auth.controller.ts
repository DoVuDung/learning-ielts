import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './dto/auth.dto';

interface RequestWithUser extends Request {
  user: AuthUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Step 1: Redirect browser to Google consent screen */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard handles the redirect – this body never executes
  }

  private resolveFrontendUrl(req: Request): string {
    const rawFrontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const allowedOrigins = rawFrontendUrl
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    const defaultOrigin = allowedOrigins[0] || 'http://localhost:3000';

    const state = typeof req.query?.state === 'string' ? req.query.state : '';
    if (state) {
      for (const origin of allowedOrigins) {
        if (state === origin || state.startsWith(`${origin}/`)) {
          return origin;
        }
      }
    }

    return defaultOrigin;
  }

  /** Step 2: Google redirects here after consent */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    const token = this.authService.login(req.user);
    const frontendUrl = this.resolveFrontendUrl(req);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  /** Return the currently authenticated user's profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser): AuthUser {
    return req.user;
  }

  /** Clear the access-token cookie */
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.json({ message: 'Logged out successfully' });
  }
}
