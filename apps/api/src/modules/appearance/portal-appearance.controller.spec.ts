import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { JwtPayload } from '@ged/types';
import type { PortalAppearance } from '@ged/database';
import { PortalAppearanceController } from './portal-appearance.controller';
import { PortalAppearanceService } from './portal-appearance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockSetting = (overrides: Partial<PortalAppearance> = {}): PortalAppearance =>
  ({
    primaryColor: '#4f46e5',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#f8fafc',
    useDefaultTheme: false,
    logoPath: null,
    logoVersion: 0,
    heroTitle: 'Portal de Documentos Públicos',
    heroSubtitle: 'Subtítulo',
    footerMessage: 'Mensagem',
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as PortalAppearance;

const user: JwtPayload = { sub: 'user-1', email: 'admin@ged.local', role: 'ADMIN' };

describe('PortalAppearanceController', () => {
  let controller: PortalAppearanceController;
  let service: jest.Mocked<PortalAppearanceService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortalAppearanceController],
      providers: [
        {
          provide: PortalAppearanceService,
          useValue: {
            getSingleton: jest.fn(),
            update: jest.fn(),
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

    controller = module.get(PortalAppearanceController);
    service = module.get(PortalAppearanceService);
  });

  it('GET / maps the entity to the response DTO', async () => {
    service.getSingleton.mockResolvedValue(mockSetting({ logoPath: 'portal/logo.png', logoVersion: 1 }));

    const result = await controller.findOne();

    expect(result).toEqual(
      expect.objectContaining({
        heroTitle: 'Portal de Documentos Públicos',
        useDefaultTheme: false,
        hasLogo: true,
        logoVersion: 1,
      }),
    );
  });

  it('PUT / delegates to service.update with the requester id', async () => {
    const dto = {
      primaryColor: '#ff0000',
      secondaryColor: '#0ea5e9',
      backgroundColor: '#f8fafc',
      heroTitle: 'Novo título',
      heroSubtitle: 'Novo subtítulo',
      footerMessage: 'Nova mensagem',
      useDefaultTheme: true,
    };
    service.update.mockResolvedValue(mockSetting(dto));

    const result = await controller.update(dto, user);

    expect(service.update).toHaveBeenCalledWith('user-1', dto);
    expect(result.heroTitle).toBe('Novo título');
    expect(result.useDefaultTheme).toBe(true);
  });

  it('POST /logo throws BadRequestException when no file is uploaded', async () => {
    await expect(
      controller.uploadLogo(undefined as unknown as Express.Multer.File, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.uploadLogo).not.toHaveBeenCalled();
  });

  it('DELETE /logo delegates to service.deleteLogo', async () => {
    service.deleteLogo.mockResolvedValue(mockSetting({ logoPath: null, logoVersion: 2 }));

    const result = await controller.deleteLogo(user);

    expect(service.deleteLogo).toHaveBeenCalledWith('user-1');
    expect(result.hasLogo).toBe(false);
  });
});
