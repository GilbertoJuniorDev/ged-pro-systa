import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';
import { MailModule } from '../mail/mail.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService, ERROR_LOGS_REDIS_CLIENT } from './error-logs.service';
import { ErrorLogsRepository } from './error-logs.repository';
import { ErrorLog, ErrorLogSchema } from './schemas/error-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErrorLog.name, schema: ErrorLogSchema },
    ]),
    UserPermissionsModule,
    MailModule,
    SystemSettingsModule,
    ConfigModule,
  ],
  controllers: [ErrorLogsController],
  providers: [
    ErrorLogsRepository,
    ErrorLogsService,
    {
      provide: ERROR_LOGS_REDIS_CLIENT,
      useFactory: async (
        configService: ConfigService,
      ): Promise<RedisClientType | null> => {
        const logger = new Logger('ErrorLogsModule');
        const client = createClient({
          url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        }) as RedisClientType;
        try {
          await client.connect();
        } catch (err) {
          logger.warn(
            `Redis indisponível — throttle de alertas desativado: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return null;
        }
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
