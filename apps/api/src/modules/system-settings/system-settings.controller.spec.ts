import { Test, type TestingModule } from '@nestjs/testing';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('SystemSettingsController', () => {
  let controller: SystemSettingsController;
  let service: jest.Mocked<SystemSettingsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemSettingsController],
      providers: [
        {
          provide: SystemSettingsService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SystemSettingsController);
    service = module.get(SystemSettingsService);
  });

  describe('GET /system-settings/:key', () => {
    it('should return key and value from service', async () => {
      service.get.mockResolvedValue('admin@ged.local');

      const result = await controller.findOne('error_alert_email');

      expect(result).toEqual({ key: 'error_alert_email', value: 'admin@ged.local' });
      expect(service.get).toHaveBeenCalledWith('error_alert_email');
    });

    it('should return null value when setting is not configured', async () => {
      service.get.mockResolvedValue(null);

      const result = await controller.findOne('error_alert_email');

      expect(result).toEqual({ key: 'error_alert_email', value: null });
    });
  });

  describe('PUT /system-settings/:key', () => {
    it('should call service.set and return updated setting', async () => {
      service.set.mockResolvedValue(undefined);

      const result = await controller.update('error_alert_email', {
        value: 'new@ged.local',
      });

      expect(service.set).toHaveBeenCalledWith('error_alert_email', 'new@ged.local');
      expect(result).toEqual({ key: 'error_alert_email', value: 'new@ged.local' });
    });

    it('should set null when value is omitted in body', async () => {
      service.set.mockResolvedValue(undefined);

      const result = await controller.update('error_alert_email', {});

      expect(service.set).toHaveBeenCalledWith('error_alert_email', null);
      expect(result).toEqual({ key: 'error_alert_email', value: null });
    });

    it('should set null when value is explicitly null', async () => {
      service.set.mockResolvedValue(undefined);

      const result = await controller.update('error_alert_email', {
        value: null,
      });

      expect(service.set).toHaveBeenCalledWith('error_alert_email', null);
      expect(result).toEqual({ key: 'error_alert_email', value: null });
    });
  });
});
