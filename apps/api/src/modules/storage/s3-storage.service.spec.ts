import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { mockClient } from 'aws-sdk-client-mock';
import { S3StorageService } from './s3-storage.service';

const ENV = {
  S3_BUCKET: 'ged-conteudos',
  S3_REGION: 'us-east-1',
  S3_FORCE_PATH_STYLE: false,
};

// ConfigService real alimentado por um objeto (sem validação nem .env)
function makeConfigService(overrides: Record<string, unknown> = {}): ConfigService {
  return new ConfigService({ ...ENV, ...overrides });
}

// Fake tipado do Body do SDK: stream + mixin de transformação (SdkStreamMixin)
function withSdkStreamMixin<T extends object>(stream: T, content: string) {
  return Object.assign(stream, {
    transformToByteArray: () => Promise.resolve(new Uint8Array(Buffer.from(content))),
    transformToString: () => Promise.resolve(content),
    transformToWebStream: () => new Blob([content]).stream(),
  });
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
    it('should send PutObject with opaque chave, metadata and body when saving to the configured bucket', async () => {
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

    it('should not embed the original name in the chave when saving', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const { chave } = await service.save({
        buffer: Buffer.from('x'),
        originalName: 'contrato-sigiloso.pdf',
        mimeType: 'application/pdf',
      });

      expect(chave).not.toContain('contrato-sigiloso');
    });

    it('should generate distinct chaves when saving twice in a row', async () => {
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

    it('should build a valid Content-Disposition when the name has accents, spaces and quotes', async () => {
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

    it('should propagate the error when PutObject fails', async () => {
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
    it('should return a Readable with the body when GetObject succeeds', async () => {
      // Em Node o SDK devolve o Body como um Readable (IncomingMessage + mixin)
      const body = withSdkStreamMixin(
        Readable.from([Buffer.from('conteudo-baixado')]),
        'conteudo-baixado',
      );
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

    it('should throw when the Body is not a Readable', async () => {
      // Body de browser (Blob) — não pode ser repassado como stream Node
      s3Mock
        .on(GetObjectCommand)
        .resolves({ Body: withSdkStreamMixin(new Blob(['x']), 'x') });

      await expect(service.getStream('documentos/2026/11/abc')).rejects.toThrow(
        'Storage não retornou um stream legível para a Chave documentos/2026/11/abc',
      );
    });
  });

  describe('credentials', () => {
    it('should sign with the explicit pair when S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are set', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});
      const withKeys = new S3StorageService(
        makeConfigService({
          S3_ACCESS_KEY_ID: 'AKIA-TESTE',
          S3_SECRET_ACCESS_KEY: 'segredo-teste',
        }),
      );

      await withKeys.delete('documentos/2026/11/abc');

      // O client que enviou o comando expõe as credenciais resolvidas pela config pública do SDK
      const client: unknown = s3Mock.call(0).thisValue;
      if (!(client instanceof S3Client)) throw new Error('comando não foi enviado por um S3Client');
      await expect(client.config.credentials()).resolves.toMatchObject({
        accessKeyId: 'AKIA-TESTE',
        secretAccessKey: 'segredo-teste',
      });
    });
  });

  describe('delete', () => {
    it('should send DeleteObject with bucket and chave when deleting', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await service.delete('documentos/2026/11/abc');

      expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'ged-conteudos',
        Key: 'documentos/2026/11/abc',
      });
    });

    it('should resolve when the object does not exist (NoSuchKey)', async () => {
      s3Mock
        .on(DeleteObjectCommand)
        .rejects(new NoSuchKey({ message: 'not found', $metadata: { httpStatusCode: 404 } }));

      await expect(service.delete('documentos/2026/11/sumiu')).resolves.toBeUndefined();
    });

    it('should resolve when the provider answers 404 without NoSuchKey', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(
        new S3ServiceException({
          name: 'NotFound',
          $fault: 'client',
          $metadata: { httpStatusCode: 404 },
        }),
      );

      await expect(service.delete('documentos/2026/11/sumiu')).resolves.toBeUndefined();
    });

    it('should propagate the error when DeleteObject fails for another reason (AccessDenied)', async () => {
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
