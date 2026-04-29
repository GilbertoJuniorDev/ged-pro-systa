/**
 * Testes E2E — AuthController
 *
 * Diferença dos testes de integração:
 *   - Cada `describe` exercita uma **jornada de usuário completa**, não um endpoint isolado.
 *   - As dependências (UsersService, RefreshTokenRepository) são mockadas para não exigir banco.
 *   - O estado dos mocks é redefinido entre jornadas via `afterEach`.
 *
 * Jornadas cobertas:
 *   A) Login → GET /auth/me → POST /auth/logout  (ciclo completo de sessão)
 *   B) Login → POST /auth/refresh → GET /auth/me com novo access token
 *   C) Acesso a rota protegida sem token → 401
 *   D) Tentativa de login inválida não vaza estado para a jornada seguinte
 */
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Reflector, APP_GUARD } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '@ged/database';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { UsersService, USER_REPOSITORY } from '@/modules/users/users.service';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { User } from '@ged/database';

// ─── Constantes de teste ──────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-key-32-characters!!';
const JWT_REFRESH_SECRET = 'test-refresh-secret-key-32-chars!';

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-e2e',
    name: 'Usuário E2E',
    email: 'e2e@ged.local',
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

// ─── Setup do módulo ──────────────────────────────────────────────────────────

describe('Auth — jornadas E2E (mocked infra)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Mocks recriados antes de cada jornada para garantir isolamento total
  let mockUsersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById' | 'create'>>;
  let mockRefreshTokenRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeAll(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockRefreshTokenRepo = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((data: unknown) => data),
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
              JWT_REFRESH_SECRET,
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
    }).compile();

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

  // ─── Jornada A: ciclo completo de sessão ──────────────────────────────────

  describe('Jornada A — login → /auth/me → logout', () => {
    it('should complete a full authenticated session', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('rt-hash' as never);
      mockUsersService.findByEmail.mockResolvedValue(user);

      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@ged.local', password: 'Senha@12345' })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      const { accessToken, refreshToken } = loginRes.body.data as {
        accessToken: string;
        refreshToken: string;
      };
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // 2. Acessar rota protegida com o access token obtido no login
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe('e2e@ged.local');
      expect(meRes.body.data.role).toBe('ADMIN');

      // 3. Logout com o mesmo refresh token
      mockRefreshTokenRepo.find.mockResolvedValue([
        {
          id: 'rt-e2e',
          token: 'rt-hash',
          userId: user.id,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      ]);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(204);

      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Jornada B: renovação de sessão via refresh token ─────────────────────

  describe('Jornada B — login → refresh → /auth/me com novo token', () => {
    it('should allow accessing protected route after token refresh', async () => {
      const user = makeUser();
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('rt-hash-new' as never);
      mockUsersService.findByEmail.mockResolvedValue(user);

      // 1. Login inicial para obter o par de tokens
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@ged.local', password: 'Senha@12345' })
        .expect(200);

      const { refreshToken: originalRefreshToken } = loginRes.body.data as {
        refreshToken: string;
      };

      // 2. Simular que o refresh token está armazenado no banco
      mockRefreshTokenRepo.find.mockResolvedValue([
        {
          id: 'rt-original',
          token: 'rt-hash-new',
          userId: user.id,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      ]);
      mockUsersService.findById.mockResolvedValue(user);

      // 3. Renovar os tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(200);

      expect(refreshRes.body.success).toBe(true);
      const { accessToken: newAccessToken } = refreshRes.body.data as {
        accessToken: string;
      };
      expect(newAccessToken).toBeDefined();

      // 4. Usar o NOVO access token para acessar rota protegida
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.sub).toBe(user.id);
    });
  });

  // ─── Jornada C: acesso não autenticado a rotas protegidas ─────────────────

  describe('Jornada C — acesso sem autenticação', () => {
    it('should block all protected routes without a bearer token', async () => {
      // GET /auth/me sem token
      await request(app.getHttpServer()).get('/auth/me').expect(401);

      // POST /auth/logout sem token
      const fakeRefreshToken = jwtService.sign(
        { sub: 'user-uuid-e2e' },
        { secret: JWT_SECRET, expiresIn: 900 },
      );
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: fakeRefreshToken })
        .expect(401);

      // Nenhum mock de serviço deve ter sido chamado
      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      expect(mockUsersService.findById).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepo.find).not.toHaveBeenCalled();
    });

    it('should return structured error body on 401', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.error).toMatchObject({
        statusCode: 401,
      });
      expect(body.timestamp).toBeDefined();
    });
  });

  // ─── Jornada D: falha de login não vaza estado ─────────────────────────────

  describe('Jornada D — falha de login não contamina sessão subsequente', () => {
    it('should not affect subsequent valid login after a failed attempt', async () => {
      const user = makeUser();

      // 1. Tentativa inválida (usuário não encontrado)
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const failedLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@ged.local', password: 'SenhaErrada@1' })
        .expect(401);

      expect(failedLogin.body.success).toBe(false);
      expect(failedLogin.body.error.statusCode).toBe(401);
      expect(mockRefreshTokenRepo.save).not.toHaveBeenCalled();

      // 2. Login válido na sequência — mocks limpos pelo afterEach já acontece aqui
      // mas usamos mockResolvedValueOnce para garantir a ordem dentro do mesmo `it`
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('rt-hash' as never);
      mockUsersService.findByEmail.mockResolvedValueOnce(user);

      const successLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@ged.local', password: 'Senha@12345' })
        .expect(200);

      expect(successLogin.body.success).toBe(true);
      expect(successLogin.body.data).toHaveProperty('accessToken');
      expect(mockRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
