import type { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { google } from 'googleapis';
import { GoogleDriveStorageService } from './storage.service';

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    drive: jest.fn().mockReturnValue({
      files: {
        create: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    }),
  },
}));

const ENV: Record<string, string> = {
  GOOGLE_DRIVE_CLIENT_ID: 'client-id',
  GOOGLE_DRIVE_CLIENT_SECRET: 'client-secret',
  GOOGLE_DRIVE_REFRESH_TOKEN: 'refresh-token',
  GOOGLE_DRIVE_FOLDER_ID: 'folder-id',
};

function makeConfigService(): ConfigService {
  return {
    getOrThrow: jest.fn((key: string) => ENV[key]),
  } as unknown as ConfigService;
}

describe('GoogleDriveStorageService', () => {
  let service: GoogleDriveStorageService;
  let driveFiles: { create: jest.Mock; get: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    service = new GoogleDriveStorageService(makeConfigService());
    driveFiles = (google.drive as jest.Mock)().files;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('uploads the buffer to the configured folder and returns chave/tamanho', async () => {
      driveFiles.create.mockResolvedValue({ data: { id: 'file-123' } });
      const buffer = Buffer.from('conteudo-do-arquivo');

      const result = await service.save({
        buffer,
        originalName: 'documento.pdf',
        mimeType: 'application/pdf',
      });

      expect(driveFiles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: { name: 'documento.pdf', parents: ['folder-id'] },
          media: expect.objectContaining({ mimeType: 'application/pdf' }),
          fields: 'id',
        }),
      );
      const call = driveFiles.create.mock.calls[0][0] as { media: { body: unknown } };
      expect(call.media.body).toBeInstanceOf(Readable);
      expect(result).toEqual({ chave: 'file-123', tamanho: buffer.length });
    });

    it('throws when Drive does not return a file ID', async () => {
      driveFiles.create.mockResolvedValue({ data: {} });

      await expect(
        service.save({
          buffer: Buffer.from('x'),
          originalName: 'a.txt',
          mimeType: 'text/plain',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getStream', () => {
    it('requests the file as a media stream and returns it', async () => {
      const fakeStream = Readable.from(['dados']);
      driveFiles.get.mockResolvedValue({ data: fakeStream });

      const result = await service.getStream('file-123');

      expect(driveFiles.get).toHaveBeenCalledWith(
        { fileId: 'file-123', alt: 'media' },
        { responseType: 'stream' },
      );
      expect(result).toBe(fakeStream);
    });
  });

  describe('delete', () => {
    it('deletes the file by ID', async () => {
      driveFiles.delete.mockResolvedValue({});

      await service.delete('file-123');

      expect(driveFiles.delete).toHaveBeenCalledWith({ fileId: 'file-123' });
    });

    it('swallows a 404 error because delete must be idempotent', async () => {
      const notFoundError = Object.assign(new Error('File not found'), {
        code: 404,
        response: { status: 404 },
      });
      driveFiles.delete.mockRejectedValue(notFoundError);

      await expect(service.delete('file-123')).resolves.toBeUndefined();
    });

    it('rethrows a non-404 error', async () => {
      const serverError = Object.assign(new Error('Internal error'), {
        code: 500,
        response: { status: 500 },
      });
      driveFiles.delete.mockRejectedValue(serverError);

      await expect(service.delete('file-123')).rejects.toThrow('Internal error');
    });
  });
});
