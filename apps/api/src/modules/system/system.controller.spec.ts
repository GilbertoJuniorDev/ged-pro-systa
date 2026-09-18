import { Test, type TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { SystemVersionDto, AdminSystemVersionDto } from './dto/system-version.dto';
import type { SystemResourcesDto } from './dto/system-resources.dto';

function makeVersionDto(): SystemVersionDto {
  return {
    appName: 'GED Pro',
    version: '0.0.1',
    environment: 'test',
    buildDate: '2026-05-21T00:00:00.000Z',
  };
}

function makeAdminVersionDto(): AdminSystemVersionDto {
  return {
    ...makeVersionDto(),
    nodeVersion: 'v22.0.0',
    dbVersion: 'PostgreSQL 17.0',
    dbStatus: 'online',
    redisStatus: 'online',
    dependencies: [
      { name: '@nestjs/core', version: '11.0.0', license: 'MIT' },
    ],
  };
}

function makeResourcesDto(): SystemResourcesDto {
  return {
    cpu: { usagePercent: 12.5, cores: 8 },
    memory: { usagePercent: 35.2, totalBytes: 100, usedBytes: 35, freeBytes: 65 },
    disk: { available: true, usagePercent: 82.4, totalBytes: 100, usedBytes: 82 },
  };
}

describe('SystemController', () => {
  let controller: SystemController;
  let service: jest.Mocked<Pick<SystemService, 'getVersion' | 'getAdminVersion' | 'getResources'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: SystemService,
          useValue: {
            getVersion: jest.fn(),
            getAdminVersion: jest.fn(),
            getResources: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SystemController>(SystemController);
    service = module.get(SystemService);
  });

  describe('GET /system/version', () => {
    it('should return SystemVersionDto from service', () => {
      const dto = makeVersionDto();
      service.getVersion.mockReturnValue(dto as unknown as SystemVersionDto);

      const result = controller.getVersion();

      expect(result).toEqual(dto);
      expect(service.getVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /system/version/admin', () => {
    it('should return AdminSystemVersionDto from service', async () => {
      const dto = makeAdminVersionDto();
      service.getAdminVersion.mockResolvedValue(dto as unknown as AdminSystemVersionDto);

      const result = await controller.getAdminVersion();

      expect(result).toEqual(dto);
      expect(service.getAdminVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /system/resources', () => {
    it('should return SystemResourcesDto from service', async () => {
      const dto = makeResourcesDto();
      service.getResources.mockResolvedValue(dto as unknown as SystemResourcesDto);

      const result = await controller.getResources();

      expect(result).toEqual(dto);
      expect(service.getResources).toHaveBeenCalledTimes(1);
    });
  });
});
