import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join, dirname } from 'path';
import { User, RefreshToken, PasswordResetToken } from '@ged/database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [User, RefreshToken, PasswordResetToken],
        synchronize: false,
        migrationsRun: true,
        logging: config.get<string>('NODE_ENV') === 'development',
        migrations: [
          join(dirname(require.resolve('@ged/database')), 'migrations', '*.js'),
        ],
      }),
    }),
  ],
})
export class DatabaseModule {}
