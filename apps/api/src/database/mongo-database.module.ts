import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
        // Manter conexão saudável e reconectar automaticamente
        serverSelectionTimeoutMS: 5_000,
        autoIndex: true,
      }),
    }),
  ],
})
export class MongoDatabaseModule {}
