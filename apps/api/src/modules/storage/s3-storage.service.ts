import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import type { IStorageService, SaveFileInput, SavedFile } from './interfaces/storage.interface';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    this.bucket = configService.getOrThrow<string>('S3_BUCKET');

    const accessKeyId = configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('S3_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: configService.getOrThrow<string>('S3_REGION'),
      // Endpoint custom só para provedores compatíveis (MinIO, R2, Wasabi)
      endpoint: configService.get<string>('S3_ENDPOINT'),
      forcePathStyle: configService.get<boolean>('S3_FORCE_PATH_STYLE') ?? false,
      // Sem par explícito, o SDK usa a cadeia padrão de credenciais
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async save(input: SaveFileInput): Promise<SavedFile> {
    const chave = buildChave(new Date());

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: chave,
        Body: input.buffer,
        ContentType: input.mimeType,
        ContentDisposition: buildContentDisposition(input.originalName),
      }),
    );

    return { chave, tamanho: input.buffer.length };
  }

  async getStream(chave: string): Promise<NodeJS.ReadableStream> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: chave }),
    );

    // Em Node o SDK entrega o Body como Readable; o tipo é uma união que também
    // cobre Blob/ReadableStream do browser, por isso a checagem explícita
    if (!(response.Body instanceof Readable)) {
      throw new Error(`Storage não retornou um stream legível para a Chave ${chave}`);
    }
    return response.Body;
  }

  async delete(chave: string): Promise<void> {
    try {
      // Sem VersionId: com versioning ligado isso cria um delete marker e a versão
      // atual vira não-corrente (expirada pelo lifecycle do bucket)
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: chave }));
    } catch (error) {
      // delete precisa ser idempotente (contrato de IStorageService)
      if (isNotFoundError(error)) return;
      throw error;
    }
  }
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof NoSuchKey) return true;
  return error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404;
}

function buildChave(now: Date): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `documentos/${yyyy}/${mm}/${randomUUID()}`;
}

// RFC 6266: `filename` com fallback ASCII seguro (sem aspas/barra/não-ASCII) para
// clientes antigos; `filename*` (RFC 5987) carrega o nome original em UTF-8.
function buildContentDisposition(originalName: string): string {
  const asciiFallback = originalName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(originalName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
