import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { SystemController } from '@/modules/system/system.controller';
import { SystemService, REDIS_CLIENT } from '@/modules/system/system.service';

const JWT_SECRET = 'test-jwt-secret-key-32-characters!!';

describe('SystemController (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockDataSource: { query: jest.Mock };
  let mockRedisClient: { ping: jest.Mock };

  function makeToken(role: 'ADMIN' | 'VIEWER'): string {
    return jwtService.sign({ sub: 'user-uuid-1', email: 'user@ged.local', role });
  }

  beforeAll(async () => {
    mockDataSource = { query: jest.fn().mockResolvedValue([{ version: 'PostgreSQL 17.0' }]) };
    mockRedisClient = { ping: jest.fn().mockResolvedValue('PONG') };

    const mockUsersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@ged.local',
        role: 'VIEWER',
        isActive: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET })],
        }),
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [SystemController],
      providers: [
        SystemService,
        RolesGuard,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: REDIS_CLIENT, useValue: mockRedisClient },
        { provide: 'UsersService', useValue: mockUsersService },
        JwtStrategy,
        Reflector,
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
          inject: [Reflector],
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /system/version', () => {
    it('should return 200 with SystemVersionDto when authenticated', async () => {
      const token = makeToken('VIEWER');

      const { body } = await request(app.getHttpServer())
        .get('/system/version')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data.appName).toBe('GED Pro');
      expect(body.data.version).toBeDefined();
      expect(body.data.environment).toBeDefined();
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/system/version').expect(401);
    });
  });

  describe('GET /system/version/admin', () => {
    it('should return 403 when user is not ADMIN', async () => {
      const token = makeToken('VIEWER');

      await request(app.getHttpServer())
        .get('/system/version/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 200 with AdminSystemVersionDto when user is ADMIN', async () => {
      const adminToken = makeToken('ADMIN');

      const mockUsersServiceInModule = app.get<{ findById: jest.Mock }>('UsersService');
      mockUsersServiceInModule.findById.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'admin@ged.local',
        role: 'ADMIN',
        isActive: true,
      });

      const { body } = await request(app.getHttpServer())
        .get('/system/version/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.data.dbStatus).toBe('online');
      expect(body.data.redisStatus).toBe('online');
      expect(body.data.nodeVersion).toBeDefined();
      expect(body.data.dependencies).toBeInstanceOf(Array);
    });

    it('should return dbStatus offline when database is unavailable', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('connection refused'));
      const adminToken = makeToken('ADMIN');

      const { body } = await request(app.getHttpServer())
        .get('/system/version/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.data.dbStatus).toBe('offline');
    });
  });
});
