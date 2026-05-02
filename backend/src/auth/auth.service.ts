import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
      user = await this.usersService.create({ googleId, email, name, avatarUrl });
    } else {
      user = await this.usersService.update(user.id, { name, avatarUrl });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium: user.isPremium,
    };
  }

  login(user: AuthUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
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
    };
  }
}
