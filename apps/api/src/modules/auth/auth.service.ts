import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, RefreshToken, PasswordResetToken } from '@ged/database';
import type { AuthTokensResponse } from '@ged/types';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

/** Converte uma string de duração (ex: "15m", "7d") para segundos */
function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d|w)$/.exec(duration);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    ms: 0.001,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };
  return Math.floor(value * (multipliers[match[2]] ?? 1));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return null;

     
    const { passwordHash: _removed, ...result } = user;
    return result as Omit<User, 'passwordHash'>;
  }

  async login(user: Omit<User, 'passwordHash'>): Promise<AuthTokensResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    const jwtExpiry = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const jwtRefreshSecret =
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const jwtRefreshExpiry =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessExpiresIn = parseDurationToSeconds(jwtExpiry);
    const refreshExpiresIn = parseDurationToSeconds(jwtRefreshExpiry);

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: jwtRefreshSecret, expiresIn: refreshExpiresIn },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    const rt = this.refreshTokenRepo.create({
      token: tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.save(rt);

    return { accessToken, refreshToken, expiresIn: accessExpiresIn, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokensResponse> {
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId },
    });

    let matchedToken: RefreshToken | null = null;
    for (const stored of storedTokens) {
      const matches = await bcrypt.compare(refreshToken, stored.token);
      if (matches) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.refreshTokenRepo.delete({ id: matchedToken.id });
      throw new UnauthorizedException('Refresh token expirado');
    }

    await this.refreshTokenRepo.delete({ id: matchedToken.id });

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.login(user as Omit<User, 'passwordHash'>);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId },
    });

    for (const stored of storedTokens) {
      const matches = await bcrypt.compare(refreshToken, stored.token);
      if (matches) {
        await this.refreshTokenRepo.delete({ id: stored.id });
        return;
      }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Silent fail — never reveal whether the address exists (OWASP A01)
    if (!user) return;

    // Remove any outstanding reset tokens for this user before issuing a new one
    await this.passwordResetTokenRepo.delete({ userId: user.id });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const prt = this.passwordResetTokenRepo.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.passwordResetTokenRepo.save(prt);

    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordReset(user.email, resetUrl, user.name);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const prt = await this.passwordResetTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!prt || prt.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const user = await this.usersService.findById(prt.userId);
    if (!user) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, passwordHash);

    await this.passwordResetTokenRepo.delete({ id: prt.id });
  }
}

