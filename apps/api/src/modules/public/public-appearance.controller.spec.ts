import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { PublicAppearanceController } from './public-appearance.controller';
import { SystemAppearanceService } from '../appearance/system-appearance.service';
import { PortalAppearanceService } from '../appearance/portal-appearance.service';

const makeResponse = (): jest.Mocked<Pick<Response, 'set'>> => ({ set: jest.fn() });

describe('PublicAppearanceController', () => {
  let controller: PublicAppearanceController;
  let systemAppearanceService: jest.Mocked<Pick<SystemAppearanceService, 'getEffectiveAppearance' | 'getLogoFile'>>;
  let portalAppearanceService: jest.Mocked<Pick<PortalAppearanceService, 'getEffectiveAppearance' | 'getLogoFile'>>;

  beforeEach(async () => {
    systemAppearanceService = { getEffectiveAppearance: jest.fn(), getLogoFile: jest.fn() };
    portalAppearanceService = { getEffectiveAppearance: jest.fn(), getLogoFile: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicAppearanceController],
      providers: [
        { provide: SystemAppearanceService, useValue: systemAppearanceService },
        { provide: PortalAppearanceService, useValue: portalAppearanceService },
      ],
    }).compile();

    controller = module.get(PublicAppearanceController);
  });

  describe('system', () => {
    it('maps the entity to the public DTO shape', async () => {
      systemAppearanceService.getEffectiveAppearance.mockResolvedValue({
        primaryColor: '#4f46e5',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#0f172a',
        logoPath: 'system/logo.png',
        logoVersion: 3,
        updatedAt: new Date('2026-01-01'),
      } as never);

      const result = await controller.system();

      expect(result).toEqual({
        primaryColor: '#4f46e5',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#0f172a',
        hasLogo: true,
        logoVersion: 3,
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('returns the default colors when the effective appearance resolves useDefaultTheme=true', async () => {
      // getEffectiveAppearance já resolve a flag — o controller só espelha o que recebe.
      systemAppearanceService.getEffectiveAppearance.mockResolvedValue({
        primaryColor: '#4f46e5',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#0f172a',
        logoPath: null,
        logoVersion: 0,
        updatedAt: new Date('2026-01-01'),
      } as never);

      const result = await controller.system();

      expect(result).toEqual(
        expect.objectContaining({
          primaryColor: '#4f46e5',
          secondaryColor: '#0ea5e9',
          backgroundColor: '#0f172a',
        }),
      );
      expect(result).not.toHaveProperty('useDefaultTheme');
    });
  });

  describe('systemLogo', () => {
    it('sets long-lived cache headers and streams the file when configured', async () => {
      const stream = { pipe: jest.fn() } as unknown as NodeJS.ReadableStream;
      systemAppearanceService.getLogoFile.mockResolvedValue({ stream, mimeType: 'image/png' });
      const res = makeResponse();

      const result = await controller.systemLogo(res as unknown as Response);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('throws NotFoundException when no logo is configured', async () => {
      systemAppearanceService.getLogoFile.mockResolvedValue(null);
      const res = makeResponse();

      await expect(controller.systemLogo(res as unknown as Response)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('portal', () => {
    it('maps the entity to the public DTO shape, including hero/footer texts', async () => {
      portalAppearanceService.getEffectiveAppearance.mockResolvedValue({
        primaryColor: '#4f46e5',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#f8fafc',
        logoPath: null,
        logoVersion: 0,
        heroTitle: 'Título',
        heroSubtitle: 'Subtítulo',
        footerMessage: 'Mensagem',
        updatedAt: new Date('2026-01-01'),
      } as never);

      const result = await controller.portal();

      expect(result).toEqual(
        expect.objectContaining({ hasLogo: false, heroTitle: 'Título', footerMessage: 'Mensagem' }),
      );
    });

    it('returns the default colors when the effective appearance resolves useDefaultTheme=true', async () => {
      portalAppearanceService.getEffectiveAppearance.mockResolvedValue({
        primaryColor: '#4f46e5',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#f8fafc',
        logoPath: null,
        logoVersion: 0,
        heroTitle: 'Título',
        heroSubtitle: 'Subtítulo',
        footerMessage: 'Mensagem',
        updatedAt: new Date('2026-01-01'),
      } as never);

      const result = await controller.portal();

      expect(result).toEqual(
        expect.objectContaining({
          primaryColor: '#4f46e5',
          secondaryColor: '#0ea5e9',
          backgroundColor: '#f8fafc',
        }),
      );
      expect(result).not.toHaveProperty('useDefaultTheme');
    });
  });

  describe('portalLogo', () => {
    it('throws NotFoundException when no logo is configured', async () => {
      portalAppearanceService.getLogoFile.mockResolvedValue(null);
      const res = makeResponse();

      await expect(controller.portalLogo(res as unknown as Response)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
