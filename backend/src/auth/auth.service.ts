import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import type { GoogleProfile, AuthUser, JwtPayload } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<AuthUser> {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        user = await this.usersService.update(user.id, { googleId, name, avatarUrl });
      } else {
        user = await this.usersService.create({ googleId, email, name, avatarUrl });
      }
    } else {
      user = await this.usersService.update(user.id, { name, avatarUrl });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium: user.isPremium,
      role: (user as any).role ?? 'USER',
    };
  }

  login(user: AuthUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  async validateLocalUser(email: string, pass: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email);
    if (user && (user as any).passwordHash) {
      const isMatch = await bcrypt.compare(pass, (user as any).passwordHash);
      if (isMatch) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isPremium: user.isPremium,
          role: (user as any).role ?? 'USER',
        };
      }
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async getProfile(userId: string): Promise<AuthUser | null> {
    const user = await this.usersService.findById(userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium: user.isPremium,
      role: (user as any).role ?? 'USER',
    };
  }
}
