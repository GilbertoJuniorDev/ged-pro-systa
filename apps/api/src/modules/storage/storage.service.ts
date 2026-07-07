import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import type { IStorageService, SaveFileInput, SavedFile } from './interfaces/storage.interface';

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const { code, response } = error as { code?: number | string; response?: { status?: number } };
  return code === 404 || response?.status === 404;
}

@Injectable()
export class GoogleDriveStorageService implements IStorageService {
  private driveClient: drive_v3.Drive | undefined;

  constructor(private readonly configService: ConfigService) {}

  async save(input: SaveFileInput): Promise<SavedFile> {
    const drive = this.getDriveClient();
    const folderId = this.configService.getOrThrow<string>('GOOGLE_DRIVE_FOLDER_ID');

    const response = await drive.files.create({
      requestBody: {
        name: input.originalName,
        parents: [folderId],
      },
      media: {
        mimeType: input.mimeType,
        body: Readable.from(input.buffer),
      },
      fields: 'id',
    });

    const chave = response.data.id;
    if (!chave) {
      throw new Error('Google Drive não retornou um ID para o arquivo enviado');
    }

    return {
      chave,
      // buffer.length já é conhecido aqui e evita depender do campo `size` do
      // Drive, que vem como string e nem sempre está populado imediatamente
      tamanho: input.buffer.length,
    };
  }

  async getStream(chave: string): Promise<NodeJS.ReadableStream> {
    const drive = this.getDriveClient();
    const response = await drive.files.get(
      { fileId: chave, alt: 'media' },
      { responseType: 'stream' },
    );

    return response.data;
  }

  async delete(chave: string): Promise<void> {
    const drive = this.getDriveClient();

    try {
      await drive.files.delete({ fileId: chave });
    } catch (error) {
      // delete precisa ser idempotente (contrato de IStorageService): um
      // arquivo já removido não deve ser tratado como falha
      if (isNotFoundError(error)) return;
      throw error;
    }
  }

  private getDriveClient(): drive_v3.Drive {
    if (!this.driveClient) {
      const clientId = this.configService.getOrThrow<string>('GOOGLE_DRIVE_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow<string>('GOOGLE_DRIVE_CLIENT_SECRET');
      const refreshToken = this.configService.getOrThrow<string>('GOOGLE_DRIVE_REFRESH_TOKEN');

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    }

    return this.driveClient;
  }
}
