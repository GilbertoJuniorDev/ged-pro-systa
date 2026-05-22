import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '@ged/database';
import { SystemSettingsRepository } from './system-settings.repository';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsController } from './system-settings.controller';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting]), UserPermissionsModule],
  providers: [SystemSettingsRepository, SystemSettingsService],
  controllers: [SystemSettingsController],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
