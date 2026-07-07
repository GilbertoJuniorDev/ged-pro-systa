import { Module } from '@nestjs/common';
import { STORAGE_SERVICE } from './interfaces/storage.interface';
import { GoogleDriveStorageService } from './storage.service';

@Module({
  providers: [{ provide: STORAGE_SERVICE, useClass: GoogleDriveStorageService }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
