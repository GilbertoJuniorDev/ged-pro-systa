import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import type { ReadStream } from 'node:fs';

export type LogoScope = 'system' | 'portal';

export interface SavedLogo {
  /** Caminho relativo ao diretório de branding — o que fica salvo no banco. */
  readonly path: string;
  readonly mimeType: string;
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

/**
 * Storage local dedicado para logos (sistema/portal) — deliberadamente separado do
 * STORAGE_SERVICE (Google Drive) usado por documentos: logo é carregado em toda
 * página anônima (login, portal público), então precisa de leitura rápida e sem
 * OAuth. Grava sob `<UPLOADS_DIR>/branding/<scope>/`.
 */
@Injectable()
export class LogoStorageService {
  private readonly logger = new Logger(LogoStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  private get baseDir(): string {
    const uploadsDir = this.configService.get<string>('UPLOADS_DIR') ?? 'uploads';
    return resolve(process.cwd(), uploadsDir, 'branding');
  }

  private absolutePathFor(relativePath: string): string {
    return join(this.baseDir, relativePath);
  }

  async save(scope: LogoScope, file: Express.Multer.File): Promise<SavedLogo> {
    // `extname` devolve '' (string vazia) e nunca null/undefined, então um `??` aqui
    // nunca dispararia e um upload sem extensão geraria arquivo sem sufixo.
    const originalExtension = extname(file.originalname);
    const extension =
      EXTENSION_BY_MIME_TYPE[file.mimetype] ??
      (originalExtension.length > 0 ? originalExtension : '.png');
    const relativePath = `${scope}/logo-${randomUUID()}${extension}`;
    const absolutePath = this.absolutePathFor(relativePath);

    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return { path: relativePath, mimeType: file.mimetype };
  }

  getReadStream(relativePath: string): ReadStream {
    return createReadStream(this.absolutePathFor(relativePath));
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.absolutePathFor(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  /** Idempotente: um arquivo já removido não é tratado como falha. */
  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(this.absolutePathFor(relativePath));
    } catch (error) {
      if (isEnoent(error)) return;
      throw error;
    }
  }

  /**
   * Remove o arquivo sem bloquear a resposta e sem derrubar o processo se falhar.
   *
   * O logo antigo é apagado depois que o novo já foi gravado no banco, então a remoção
   * não pode falhar a requisição -- mas um `void this.delete(...)` cru deixaria a promise
   * rejeitada sem tratamento: `delete` só engole ENOENT, e um EACCES/EBUSY (comum no
   * Windows quando o arquivo está aberto) viraria um unhandledRejection, que no Node
   * moderno encerra o processo. O pior caso aceitável aqui é um arquivo órfão em disco.
   */
  deleteInBackground(relativePath: string): void {
    void this.delete(relativePath).catch((error: unknown) => {
      this.logger.warn(
        `Falha ao remover o logo antigo "${relativePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }
}
