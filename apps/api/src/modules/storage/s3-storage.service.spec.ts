import type { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { mockClient } from 'aws-sdk-client-mock';
import { S3StorageService } from './s3-storage.service';

const ENV: Record<string, unknown> = {
  S3_BUCKET: 'ged-conteudos',
  S3_REGION: 'us-east-1',
  S3_FORCE_PATH_STYLE: false,
};

function makeConfigService(): ConfigService {
  return {
    get: jest.fn((key: string) => ENV[key]),
    getOrThrow: jest.fn((key: string) => {
      if (ENV[key] === undefined) throw new Error(`missing ${key}`);
      return ENV[key];
    }),
  } as unknown as ConfigService;
}

const CHAVE_PATTERN =
  /^documentos\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('S3StorageService', () => {
  const s3Mock = mockClient(S3Client);
  let service: S3StorageService;

  beforeEach(() => {
    s3Mock.reset();
    service = new S3StorageService(makeConfigService());
  });

  describe('save', () => {
    it('sends PutObject to the configured bucket with opaque chave, metadata and body', async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      const buffer = Buffer.from('conteudo-do-documento');

      const result = await service.save({
        buffer,
        originalName: 'documento.pdf',
        mimeType: 'application/pdf',
      });

      const calls = s3Mock.commandCalls(PutObjectCommand);
      expect(calls).toHaveLength(1);
      const input = calls[0].args[0].input;
      expect(input.Bucket).toBe('ged-conteudos');
      expect(input.Key).toMatch(CHAVE_PATTERN);
      expect(input.ContentType).toBe('application/pdf');
      expect(input.ContentDisposition).toBe(
        `attachment; filename="documento.pdf"; filename*=UTF-8''documento.pdf`,
      );
      expect(input.Body).toEqual(buffer);
      expect(result).toEqual({ chave: input.Key, tamanho: 21 });
    });

    it('never embeds the original name in the chave', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const { chave } = await service.save({
        buffer: Buffer.from('x'),
        originalName: 'contrato-sigiloso.pdf',
        mimeType: 'application/pdf',
      });

      expect(chave).not.toContain('contrato-sigiloso');
    });

    it('generates distinct chaves for two consecutive saves', async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      const input = {
        buffer: Buffer.from('x'),
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
      };

      const first = await service.save(input);
      const second = await service.save(input);

      expect(first.chave).not.toBe(second.chave);
    });

    it('builds a valid Content-Disposition for names with accents, spaces and quotes', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      await service.save({
        buffer: Buffer.from('x'),
        originalName: 'Ofício d\'água "final".pdf',
        mimeType: 'application/pdf',
      });

      const input = s3Mock.commandCalls(PutObjectCommand)[0].args[0].input;
      expect(input.ContentDisposition).toBe(
        `attachment; filename="Of_cio d'_gua _final_.pdf"; filename*=UTF-8''Of%C3%ADcio%20d%27%C3%A1gua%20%22final%22.pdf`,
      );
    });

    it('propagates S3 errors on PutObject', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 indisponível'));

      await expect(
        service.save({
          buffer: Buffer.from('x'),
          originalName: 'a.pdf',
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow('S3 indisponível');
    });
  });

  describe('getStream', () => {
    it('sends GetObject with bucket and chave and returns a Readable with the body', async () => {
      // Em Node o SDK devolve o Body como um Readable (IncomingMessage + mixin)
      const body = Readable.from([
        Buffer.from('conteudo-baixado'),
      ]) as unknown as GetObjectCommandOutput['Body'];
      s3Mock.on(GetObjectCommand).resolves({ Body: body });

      const stream = await service.getStream('documentos/2026/11/abc');

      expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'ged-conteudos',
        Key: 'documentos/2026/11/abc',
      });
      expect(stream).toBeInstanceOf(Readable);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
      expect(Buffer.concat(chunks).toString()).toBe('conteudo-baixado');
    });
  });

  describe('delete', () => {
    it('sends DeleteObject with bucket and chave', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await service.delete('documentos/2026/11/abc');

      expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'ged-conteudos',
        Key: 'documentos/2026/11/abc',
      });
    });

    it('resolves when the object does not exist (NoSuchKey)', async () => {
      s3Mock
        .on(DeleteObjectCommand)
        .rejects(new NoSuchKey({ message: 'not found', $metadata: { httpStatusCode: 404 } }));

      await expect(service.delete('documentos/2026/11/sumiu')).resolves.toBeUndefined();
    });

    it('resolves when the provider answers 404 without NoSuchKey', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(
        new S3ServiceException({
          name: 'NotFound',
          $fault: 'client',
          $metadata: { httpStatusCode: 404 },
        }),
      );

      await expect(service.delete('documentos/2026/11/sumiu')).resolves.toBeUndefined();
    });

    it('propagates any other error (e.g. AccessDenied)', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(
        new S3ServiceException({
          name: 'AccessDenied',
          message: 'Access Denied',
          $fault: 'client',
          $metadata: { httpStatusCode: 403 },
        }),
      );

      await expect(service.delete('documentos/2026/11/abc')).rejects.toThrow('Access Denied');
    });
  });
});
