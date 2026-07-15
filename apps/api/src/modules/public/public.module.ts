import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Document, DocumentLead } from '@ged/database';
import { StorageModule } from '../storage/storage.module';
import { PublicDocumentsController } from './public-documents.controller';
import { PublicDocumentsService } from './public-documents.service';
import { PublicDocumentsRepository } from './public-documents.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentLead]),
    StorageModule,
    // Mesmo padrão de AuthModule: reaproveita o JWT_SECRET já configurado (não inventa
    // uma env var nova) para assinar/verificar o token curto do gate de download.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [PublicDocumentsController],
  providers: [PublicDocumentsService, PublicDocumentsRepository],
})
export class PublicModule {}
