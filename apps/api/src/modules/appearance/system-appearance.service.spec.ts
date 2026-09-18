import { Test, type TestingModule } from '@nestjs/testing';
import type { AppearanceSetting } from '@ged/database';
import { SystemAppearanceService } from './system-appearance.service';
import { SYSTEM_APPEARANCE_REPOSITORY } from './interfaces/system-appearance-repository.interface';
import type { ISystemAppearanceRepository } from './interfaces/system-appearance-repository.interface';
import { LogoStorageService } from './logo-storage.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const mockSetting = (overrides: Partial<AppearanceSetting> = {}): AppearanceSetting =>
  ({
    id: 'appearance-1',
    primaryColor: '#4f46e5',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#0f172a',
    logoPath: null,
    logoMimeType: null,
    logoVersion: 0,
    singleton: 'X',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as AppearanceSetting;

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    fieldname: 'logo',
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake'),
    size: 4,
    ...overrides,
  }) as unknown as Express.Multer.File;

describe('SystemAppearanceService', () => {
  let service: SystemAppearanceService;
  let repo: jest.Mocked<ISystemAppearanceRepository>;
  let logoStorage: jest.Mocked<Pick<LogoStorageService, 'save' | 'delete' | 'deleteInBackground' | 'exists' | 'getReadStream'>>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    repo = {
      findSingleton: jest.fn(),
      updateColors: jest.fn(),
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
        SystemAppearanceService,
        { provide: SYSTEM_APPEARANCE_REPOSITORY, useValue: repo },
        { provide: LogoStorageService, useValue: logoStorage },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get(SystemAppearanceService);
  });

  describe('getSingleton', () => {
    it('returns the singleton row', async () => {
      const setting = mockSetting();
      repo.findSingleton.mockResolvedValue(setting);
      await expect(service.getSingleton()).resolves.toBe(setting);
    });
  });

  describe('updateColors', () => {
    it('updates colors and logs the audit trail with before/after values', async () => {
      const existing = mockSetting();
      const updated = mockSetting({ primaryColor: '#ff0000' });
      repo.findSingleton.mockResolvedValue(existing);
      repo.updateColors.mockResolvedValue(updated);

      const result = await service.updateColors('user-1', {
        primaryColor: '#ff0000',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#0f172a',
      });

      expect(repo.updateColors).toHaveBeenCalledWith({
        primaryColor: '#ff0000',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#0f172a',
      });
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-1',
          acao: 'system_appearance.colors_updated',
          dadosAnteriores: expect.objectContaining({ primaryColor: '#4f46e5' }),
          dadosNovos: expect.objectContaining({ primaryColor: '#ff0000' }),
        }),
      );
      expect(result).toBe(updated);
    });
  });

  describe('uploadLogo', () => {
    it('saves the file, bumps logoVersion and deletes the previous logo', async () => {
      const existing = mockSetting({ logoPath: 'system/old.png', logoVersion: 3 });
      repo.findSingleton.mockResolvedValue(existing);
      logoStorage.save.mockResolvedValue({ path: 'system/new.png', mimeType: 'image/png' });
      const updated = mockSetting({ logoPath: 'system/new.png', logoVersion: 4 });
      repo.updateLogo.mockResolvedValue(updated);

      const result = await service.uploadLogo('user-1', mockFile());

      expect(logoStorage.save).toHaveBeenCalledWith('system', expect.anything());
      expect(repo.updateLogo).toHaveBeenCalledWith({
        logoPath: 'system/new.png',
        logoMimeType: 'image/png',
        logoVersion: 4,
      });
      expect(logoStorage.deleteInBackground).toHaveBeenCalledWith('system/old.png');
      expect(result).toBe(updated);
    });

    it('rolls back (deletes the just-saved file) when persisting the new logo fails', async () => {
      const existing = mockSetting({ logoPath: null, logoVersion: 0 });
      repo.findSingleton.mockResolvedValue(existing);
      logoStorage.save.mockResolvedValue({ path: 'system/new.png', mimeType: 'image/png' });
      repo.updateLogo.mockRejectedValue(new Error('db down'));

      await expect(service.uploadLogo('user-1', mockFile())).rejects.toThrow('db down');

      expect(logoStorage.delete).toHaveBeenCalledWith('system/new.png');
    });

    it('does not attempt to delete a previous logo when none existed', async () => {
      const existing = mockSetting({ logoPath: null, logoVersion: 0 });
      repo.findSingleton.mockResolvedValue(existing);
      logoStorage.save.mockResolvedValue({ path: 'system/new.png', mimeType: 'image/png' });
      repo.updateLogo.mockResolvedValue(mockSetting({ logoPath: 'system/new.png', logoVersion: 1 }));

      await service.uploadLogo('user-1', mockFile());

      expect(logoStorage.deleteInBackground).not.toHaveBeenCalled();
    });
  });

  describe('deleteLogo', () => {
    it('clears the logo columns and deletes the file', async () => {
      const existing = mockSetting({ logoPath: 'system/old.png', logoVersion: 3 });
      repo.findSingleton.mockResolvedValue(existing);
      const updated = mockSetting({ logoPath: null, logoVersion: 4 });
      repo.updateLogo.mockResolvedValue(updated);

      const result = await service.deleteLogo('user-1');

      expect(repo.updateLogo).toHaveBeenCalledWith({
        logoPath: null,
        logoMimeType: null,
        logoVersion: 4,
      });
      expect(logoStorage.deleteInBackground).toHaveBeenCalledWith('system/old.png');
      expect(result).toBe(updated);
    });
  });

  describe('getLogoFile', () => {
    it('returns null when no logo is configured', async () => {
      repo.findSingleton.mockResolvedValue(mockSetting({ logoPath: null }));
      await expect(service.getLogoFile()).resolves.toBeNull();
    });

    it('returns null when the configured file no longer exists on disk', async () => {
      repo.findSingleton.mockResolvedValue(
        mockSetting({ logoPath: 'system/missing.png', logoMimeType: 'image/png' }),
      );
      logoStorage.exists.mockResolvedValue(false);

      await expect(service.getLogoFile()).resolves.toBeNull();
    });

    it('returns the stream and mime type when the logo exists', async () => {
      repo.findSingleton.mockResolvedValue(
        mockSetting({ logoPath: 'system/logo.png', logoMimeType: 'image/png' }),
      );
      logoStorage.exists.mockResolvedValue(true);
      const stream = {} as NodeJS.ReadableStream;
      logoStorage.getReadStream.mockReturnValue(stream as ReturnType<LogoStorageService['getReadStream']>);

      const result = await service.getLogoFile();

      expect(result).toEqual({ stream, mimeType: 'image/png' });
    });
  });
});
