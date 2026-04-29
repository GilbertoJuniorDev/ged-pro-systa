import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '@ged/database';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { UsersService, USER_REPOSITORY } from '@/modules/users/users.service';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import type { User } from '@ged/database';

const JWT_SECRET = 'test-jwt-secret-key-32-characters!!';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    name: 'Admin',
    email: 'admin@ged.local',
    passwordHash: 'hashed',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    documents: [],
    refreshTokens: [],
    ...overrides,
  } as User;
}

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let mockUsersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById' | 'create'>>;
  let mockRefreshTokenRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let jwtService: JwtService;

  beforeAll(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockRefreshTokenRepo = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET,
              JWT_REFRESH_SECRET: 'test-refresh-secret-key-32-chars!',
              JWT_EXPIRY: '15m',
              JWT_REFRESH_EXPIRY: '7d',
            }),
          ],
        }),
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: USER_REPOSITORY, useValue: {} },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        Reflector,
      ],
    })
      .overrideProvider('JWT_SECRET')
      .useValue(JWT_SECRET)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 200 with tokens when credentials are valid', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('rt-hash' as never);
      mockUsersService.findByEmail.mockResolvedValue(user);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@ged.local', password: 'Admin@12345' })
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
      expect(body.data).toHaveProperty('expiresIn');
    });

    it('should return 401 when credentials are invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@ged.local', password: 'wrong-pass12' })
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.error.statusCode).toBe(401);
    });

    it('should return 400 when email is invalid', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);

      expect(body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 400 when refreshToken is not a JWT', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'not-a-jwt' })
        .expect(400);

      expect(body.success).toBe(false);
    });

    it('should return 401 when no matching token found in database', async () => {
      const fakeToken = jwtService.sign(
        { sub: 'user-uuid-1' },
        { secret: JWT_SECRET, expiresIn: 900 },
      );
      mockRefreshTokenRepo.find.mockResolvedValue([]);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: fakeToken })
        .expect(401);

      expect(body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 when no bearer token is provided', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return user payload when JWT is valid', async () => {
      const token = jwtService.sign(
        { sub: 'user-uuid-1', email: 'admin@ged.local', role: 'ADMIN' },
        { secret: JWT_SECRET },
      );

      const { body } = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data.email).toBe('admin@ged.local');
      expect(body.data.role).toBe('ADMIN');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 401 when no bearer token is provided', async () => {
      const refreshToken = jwtService.sign(
        { sub: 'user-uuid-1' },
        { secret: JWT_SECRET, expiresIn: 900 },
      );
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });

    it('should return 204 when logout is successful', async () => {
      const accessToken = jwtService.sign(
        { sub: 'user-uuid-1', email: 'admin@ged.local', role: 'ADMIN' },
        { secret: JWT_SECRET },
      );
      const refreshToken = jwtService.sign(
        { sub: 'user-uuid-1' },
        { secret: JWT_SECRET, expiresIn: 900 },
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockRefreshTokenRepo.find.mockResolvedValue([
        {
          id: 'rt-1',
          token: 'hash',
          userId: 'user-uuid-1',
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(204);
    });
  });
});

