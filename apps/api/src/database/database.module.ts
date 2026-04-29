import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, RefreshToken } from '@ged/database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [User, RefreshToken],
        synchronize: false,
        migrationsRun: true,
        logging: config.get<string>('NODE_ENV') === 'development',
        migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
      }),
    }),
  ],
})
export class DatabaseModule {}
