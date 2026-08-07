import {
  Controller,
  Get,
  Post,
  Body,
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
import { LoginDto } from './dto/login.dto';

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
    const rawOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
    ]
      .filter(Boolean)
      .join(',');

    const allowedOrigins = rawOrigins
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
    const isAdmin =
      frontendUrl === process.env.ADMIN_URL?.replace(/\/+$/, '') ||
      frontendUrl === 'http://localhost:5173' ||
      frontendUrl === 'http://localhost:4173';

    const callbackPath = isAdmin ? '/?token=' : '/auth/callback?token=';
    return res.redirect(`${frontendUrl}${callbackPath}${token}`);
  }

  /** Return the currently authenticated user's profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser): AuthUser {
    return req.user;
  }

  /** Logout */
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    return res.json({ message: 'Logged out successfully' });
  }

  /** Local Login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateLocalUser(loginDto.email, loginDto.password);
    const token = this.authService.login(user);
    return { token, user };
  }
}
