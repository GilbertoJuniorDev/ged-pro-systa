import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '@ged/database';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { USER_REPOSITORY } from '../users/users.service';
import type { User } from '@ged/database';

// Fábrica para criar um User de teste sem passwordHash
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@ged.local',
    passwordHash: 'hashed-password',
    role: 'VIEWER',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    documents: [],
    refreshTokens: [],
    ...overrides,
  } as User;
}

function makeRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'rt-uuid-1',
    token: 'hashed-rt',
    userId: 'user-uuid-1',
    expiresAt: new Date(Date.now() + 86400 * 7 * 1000),
    createdAt: new Date('2026-01-01'),
    user: {} as User,
    ...overrides,
  } as RefreshToken;
}

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign' | 'decode'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get' | 'getOrThrow'>>;
  let mockRefreshTokenRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      decode: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          JWT_EXPIRY: '15m',
          JWT_REFRESH_EXPIRY: '7d',
        };
        return config[key];
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'super-secret-jwt-key-with-32-chars!!',
          JWT_REFRESH_SECRET: 'super-refresh-secret-key-32-chars!',
        };
        return config[key];
      }),
    };

    mockRefreshTokenRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
        // UsersService exige o token USER_REPOSITORY, mas aqui usamos mock direto
        {
          provide: USER_REPOSITORY,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user without passwordHash when credentials are valid', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockUsersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('test@ged.local', 'correct-password');

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.email).toBe('test@ged.local');
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('unknown@ged.local', 'any-password');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockUsersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('test@ged.local', 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens with expiresIn', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-rt' as never);
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.expiresIn).toBe('number');
      expect(mockRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should save a hashed refresh token in the database', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('bcrypt-hash' as never);
      mockRefreshTokenRepo.create.mockReturnValue({ token: 'bcrypt-hash' });
      mockRefreshTokenRepo.save.mockResolvedValue({});

      await service.login(user);

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'bcrypt-hash', userId: user.id }),
      );
    });
  });

  describe('refreshTokens', () => {
    it('should issue new tokens when refresh token is valid', async () => {
      const stored = makeRefreshToken();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never);
      mockRefreshTokenRepo.find.mockResolvedValue([stored]);
      mockRefreshTokenRepo.delete.mockResolvedValue({});
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});
      mockUsersService.findById.mockResolvedValue(makeUser());

      const result = await service.refreshTokens('user-uuid-1', 'raw-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({ id: stored.id });
    });

    it('should throw UnauthorizedException when no matching token is found', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockRefreshTokenRepo.find.mockResolvedValue([makeRefreshToken()]);

      await expect(
        service.refreshTokens('user-uuid-1', 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredToken = makeRefreshToken({
        expiresAt: new Date(Date.now() - 1000),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockRefreshTokenRepo.find.mockResolvedValue([expiredToken]);
      mockRefreshTokenRepo.delete.mockResolvedValue({});

      await expect(
        service.refreshTokens('user-uuid-1', 'expired-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({ id: expiredToken.id });
    });

    it('should throw NotFoundException when user no longer exists', async () => {
      const stored = makeRefreshToken();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockRefreshTokenRepo.find.mockResolvedValue([stored]);
      mockRefreshTokenRepo.delete.mockResolvedValue({});
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        service.refreshTokens('user-uuid-1', 'raw-token'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should delete the matching refresh token', async () => {
      const stored = makeRefreshToken();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockRefreshTokenRepo.find.mockResolvedValue([stored]);
      mockRefreshTokenRepo.delete.mockResolvedValue({});

      await service.logout('user-uuid-1', 'raw-token');

      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({ id: stored.id });
    });

    it('should do nothing when no matching token is found', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockRefreshTokenRepo.find.mockResolvedValue([makeRefreshToken()]);

      await service.logout('user-uuid-1', 'unknown-token');

      expect(mockRefreshTokenRepo.delete).not.toHaveBeenCalled();
    });
  });
});
