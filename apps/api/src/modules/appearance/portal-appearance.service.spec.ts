import { Test, type TestingModule } from '@nestjs/testing';
import type { PortalAppearance } from '@ged/database';
import { PortalAppearanceService } from './portal-appearance.service';
import { PORTAL_APPEARANCE_REPOSITORY } from './interfaces/portal-appearance-repository.interface';
import type { IPortalAppearanceRepository } from './interfaces/portal-appearance-repository.interface';
import { LogoStorageService } from './logo-storage.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const mockSetting = (overrides: Partial<PortalAppearance> = {}): PortalAppearance =>
  ({
    id: 'portal-appearance-1',
    primaryColor: '#4f46e5',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#f8fafc',
    logoPath: null,
    logoMimeType: null,
    logoVersion: 0,
    heroTitle: 'Portal de Documentos Públicos',
    heroSubtitle: 'Subtítulo padrão',
    footerMessage: 'Mensagem padrão',
    singleton: 'X',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as PortalAppearance;

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    fieldname: 'logo',
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake'),
    size: 4,
    ...overrides,
  }) as unknown as Express.Multer.File;

describe('PortalAppearanceService', () => {
  let service: PortalAppearanceService;
  let repo: jest.Mocked<IPortalAppearanceRepository>;
  let logoStorage: jest.Mocked<Pick<LogoStorageService, 'save' | 'delete' | 'deleteInBackground' | 'exists' | 'getReadStream'>>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    repo = {
      findSingleton: jest.fn(),
      update: jest.fn(),
      updateLogo: jest.fn(),
    };
    logoStorage = {
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteInBackground: jest.fn(),
      exists: jest.fn(),
      getReadStream: jest.fn(),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PortalAppearanceService,
        { provide: PORTAL_APPEARANCE_REPOSITORY, useValue: repo },
        { provide: LogoStorageService, useValue: logoStorage },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get(PortalAppearanceService);
  });

  describe('update', () => {
    it('updates colors and texts and logs the audit trail', async () => {
      const existing = mockSetting();
      const payload = {
        primaryColor: '#ff0000',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#f8fafc',
        heroTitle: 'Novo título',
        heroSubtitle: 'Novo subtítulo',
        footerMessage: 'Nova mensagem',
      };
      const updated = mockSetting(payload);
      repo.findSingleton.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('user-1', payload);

      expect(repo.update).toHaveBeenCalledWith(payload);
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-1',
          acao: 'portal_appearance.updated',
          dadosAnteriores: expect.objectContaining({ heroTitle: 'Portal de Documentos Públicos' }),
          dadosNovos: expect.objectContaining({ heroTitle: 'Novo título' }),
        }),
      );
      expect(result).toBe(updated);
    });
  });

  describe('uploadLogo', () => {
    it('saves under the "portal" scope and deletes the previous logo', async () => {
      const existing = mockSetting({ logoPath: 'portal/old.png', logoVersion: 1 });
      repo.findSingleton.mockResolvedValue(existing);
      logoStorage.save.mockResolvedValue({ path: 'portal/new.png', mimeType: 'image/png' });
      const updated = mockSetting({ logoPath: 'portal/new.png', logoVersion: 2 });
      repo.updateLogo.mockResolvedValue(updated);

      const result = await service.uploadLogo('user-1', mockFile());

      expect(logoStorage.save).toHaveBeenCalledWith('portal', expect.anything());
      expect(logoStorage.deleteInBackground).toHaveBeenCalledWith('portal/old.png');
      expect(result).toBe(updated);
    });

    it('rolls back when persisting the new logo fails', async () => {
      repo.findSingleton.mockResolvedValue(mockSetting({ logoPath: null }));
      logoStorage.save.mockResolvedValue({ path: 'portal/new.png', mimeType: 'image/png' });
      repo.updateLogo.mockRejectedValue(new Error('db down'));

      await expect(service.uploadLogo('user-1', mockFile())).rejects.toThrow('db down');
      expect(logoStorage.delete).toHaveBeenCalledWith('portal/new.png');
    });
  });

  describe('deleteLogo', () => {
    it('clears the logo columns and deletes the file', async () => {
      const existing = mockSetting({ logoPath: 'portal/old.png', logoVersion: 1 });
      repo.findSingleton.mockResolvedValue(existing);
      const updated = mockSetting({ logoPath: null, logoVersion: 2 });
      repo.updateLogo.mockResolvedValue(updated);

      const result = await service.deleteLogo('user-1');

      expect(repo.updateLogo).toHaveBeenCalledWith({
        logoPath: null,
        logoMimeType: null,
        logoVersion: 2,
      });
      expect(result).toBe(updated);
    });
  });

  describe('getLogoFile', () => {
    it('returns null when no logo is configured', async () => {
      repo.findSingleton.mockResolvedValue(mockSetting({ logoPath: null }));
      await expect(service.getLogoFile()).resolves.toBeNull();
    });

    it('returns the stream and mime type when the logo exists', async () => {
      repo.findSingleton.mockResolvedValue(
        mockSetting({ logoPath: 'portal/logo.png', logoMimeType: 'image/png' }),
      );
      logoStorage.exists.mockResolvedValue(true);
      const stream = {} as NodeJS.ReadableStream;
      logoStorage.getReadStream.mockReturnValue(stream as ReturnType<LogoStorageService['getReadStream']>);

      await expect(service.getLogoFile()).resolves.toEqual({ stream, mimeType: 'image/png' });
    });
  });
});
