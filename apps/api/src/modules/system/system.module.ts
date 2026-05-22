import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { SystemController } from './system.controller';
import { SystemService, REDIS_CLIENT } from './system.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [SystemController],
  providers: [
    SystemService,
    RolesGuard,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): RedisClientType => {
        return createClient({
          url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        }) as RedisClientType;
      },
      inject: [ConfigService],
    },
  ],
})
export class SystemModule {}
