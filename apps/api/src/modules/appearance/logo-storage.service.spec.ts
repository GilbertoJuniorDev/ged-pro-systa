import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import { LogoStorageService } from './logo-storage.service';

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'logo',
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-png-bytes'),
    size: 14,
    ...overrides,
  } as unknown as Express.Multer.File;
}

describe('LogoStorageService', () => {
  let uploadsDir: string;
  let cwdSpy: jest.SpyInstance<string, []>;
  let service: LogoStorageService;

  beforeEach(async () => {
    uploadsDir = await fs.mkdtemp(join(tmpdir(), 'ged-branding-'));
    // process.cwd() é usado internamente para resolver UPLOADS_DIR — mockar aqui evita
    // depender do diretório real de execução do teste.
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(uploadsDir);
    const configService = { get: () => 'uploads' } as unknown as ConfigService;
    service = new LogoStorageService(configService);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await fs.rm(uploadsDir, { recursive: true, force: true });
  });

  it('saves a file under <baseDir>/branding/<scope>/ with a unique name', async () => {
    const saved = await service.save('system', makeFile());

    expect(saved.path).toMatch(/^system\/logo-[0-9a-f-]{36}\.png$/);
    expect(saved.mimeType).toBe('image/png');
    await expect(service.exists(saved.path)).resolves.toBe(true);

    const absolutePath = join(uploadsDir, 'uploads', 'branding', saved.path);
    const contents = await fs.readFile(absolutePath);
    expect(contents.toString()).toBe('fake-png-bytes');
  });

  it('uses distinct filenames for two uploads of the same scope', async () => {
    const first = await service.save('system', makeFile());
    const second = await service.save('system', makeFile());

    expect(first.path).not.toBe(second.path);
  });

  it('picks the extension by mime type, falling back to the original filename extension', async () => {
    const webp = await service.save('portal', makeFile({ mimetype: 'image/webp', originalname: 'logo.webp' }));
    expect(webp.path.endsWith('.webp')).toBe(true);

    const unknownMime = await service.save(
      'portal',
      makeFile({ mimetype: 'application/octet-stream', originalname: 'logo.jpg' }),
    );
    expect(unknownMime.path.endsWith('.jpg')).toBe(true);
  });

  describe('exists', () => {
    it('returns false for a file that was never saved', async () => {
      await expect(service.exists('system/never-existed.png')).resolves.toBe(false);
    });
  });

  describe('delete', () => {
    it('removes a saved file', async () => {
      const saved = await service.save('system', makeFile());
      await service.delete(saved.path);
      await expect(service.exists(saved.path)).resolves.toBe(false);
    });

    it('is idempotent — deleting an already-removed file does not throw', async () => {
      await expect(service.delete('system/does-not-exist.png')).resolves.toBeUndefined();
    });
  });

  describe('getReadStream', () => {
    it('streams back the exact bytes that were saved', async () => {
      const saved = await service.save('system', makeFile());

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = service.getReadStream(saved.path);
        stream.on('data', (chunk: string | Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      expect(Buffer.concat(chunks).toString()).toBe('fake-png-bytes');
    });
  });
});
