import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { JwtPayload } from '@ged/types';
import type { AppearanceSetting } from '@ged/database';
import { SystemAppearanceController } from './system-appearance.controller';
import { SystemAppearanceService } from './system-appearance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockSetting = (overrides: Partial<AppearanceSetting> = {}): AppearanceSetting =>
  ({
    primaryColor: '#4f46e5',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#0f172a',
    logoPath: null,
    logoVersion: 0,
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as AppearanceSetting;

const user: JwtPayload = { sub: 'user-1', email: 'admin@ged.local', role: 'ADMIN' };

describe('SystemAppearanceController', () => {
  let controller: SystemAppearanceController;
  let service: jest.Mocked<SystemAppearanceService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemAppearanceController],
      providers: [
        {
          provide: SystemAppearanceService,
          useValue: {
            getSingleton: jest.fn(),
            updateColors: jest.fn(),
            uploadLogo: jest.fn(),
            deleteLogo: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SystemAppearanceController);
    service = module.get(SystemAppearanceService);
  });

  it('GET / maps the entity to the response DTO, deriving hasLogo from logoPath', async () => {
    service.getSingleton.mockResolvedValue(mockSetting({ logoPath: 'system/logo.png', logoVersion: 2 }));

    const result = await controller.findOne();

    expect(result).toEqual(
      expect.objectContaining({ primaryColor: '#4f46e5', hasLogo: true, logoVersion: 2 }),
    );
  });

  it('GET / reports hasLogo=false when no logo is configured', async () => {
    service.getSingleton.mockResolvedValue(mockSetting({ logoPath: null }));

    const result = await controller.findOne();

    expect(result.hasLogo).toBe(false);
  });

  it('PUT / delegates to service.updateColors with the requester id', async () => {
    const dto = { primaryColor: '#ff0000', secondaryColor: '#0ea5e9', backgroundColor: '#0f172a' };
    service.updateColors.mockResolvedValue(mockSetting(dto));

    const result = await controller.update(dto, user);

    expect(service.updateColors).toHaveBeenCalledWith('user-1', dto);
    expect(result.primaryColor).toBe('#ff0000');
  });

  it('POST /logo throws BadRequestException when no file is uploaded', async () => {
    await expect(
      controller.uploadLogo(undefined as unknown as Express.Multer.File, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.uploadLogo).not.toHaveBeenCalled();
  });

  it('POST /logo delegates to service.uploadLogo when a file is present', async () => {
    const file = { originalname: 'logo.png', mimetype: 'image/png' } as Express.Multer.File;
    service.uploadLogo.mockResolvedValue(mockSetting({ logoPath: 'system/logo.png', logoVersion: 1 }));

    const result = await controller.uploadLogo(file, user);

    expect(service.uploadLogo).toHaveBeenCalledWith('user-1', file);
    expect(result.hasLogo).toBe(true);
  });

  it('DELETE /logo delegates to service.deleteLogo', async () => {
    service.deleteLogo.mockResolvedValue(mockSetting({ logoPath: null, logoVersion: 2 }));

    const result = await controller.deleteLogo(user);

    expect(service.deleteLogo).toHaveBeenCalledWith('user-1');
    expect(result.hasLogo).toBe(false);
  });
});
