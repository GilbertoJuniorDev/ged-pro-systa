import { Module } from '@nestjs/common';
import { STORAGE_SERVICE } from './interfaces/storage.interface';
import { S3StorageService } from './s3-storage.service';

@Module({
  providers: [{ provide: STORAGE_SERVICE, useClass: S3StorageService }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
