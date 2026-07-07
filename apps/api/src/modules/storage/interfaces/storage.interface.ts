export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface SaveFileInput {
  readonly buffer: Buffer;
  readonly originalName: string;
  readonly mimeType: string;
}

export interface SavedFile {
  readonly chave: string; // Google Drive file ID
  readonly tamanho: number; // bytes
}

export interface IStorageService {
  save(input: SaveFileInput): Promise<SavedFile>;
  getStream(chave: string): Promise<NodeJS.ReadableStream>;
  delete(chave: string): Promise<void>;
}
