import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppearanceSetting, PortalAppearance } from '@ged/database';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';
import { SystemAppearanceController } from './system-appearance.controller';
import { PortalAppearanceController } from './portal-appearance.controller';
import { SystemAppearanceService } from './system-appearance.service';
import { PortalAppearanceService } from './portal-appearance.service';
import { SystemAppearanceRepository } from './system-appearance.repository';
import { PortalAppearanceRepository } from './portal-appearance.repository';
import { LogoStorageService } from './logo-storage.service';
import { SYSTEM_APPEARANCE_REPOSITORY } from './interfaces/system-appearance-repository.interface';
import { PORTAL_APPEARANCE_REPOSITORY } from './interfaces/portal-appearance-repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppearanceSetting, PortalAppearance]),
    AuditLogsModule,
    UserPermissionsModule,
  ],
  controllers: [SystemAppearanceController, PortalAppearanceController],
  providers: [
    { provide: SYSTEM_APPEARANCE_REPOSITORY, useClass: SystemAppearanceRepository },
    { provide: PORTAL_APPEARANCE_REPOSITORY, useClass: PortalAppearanceRepository },
    LogoStorageService,
    SystemAppearanceService,
    PortalAppearanceService,
  ],
  // Exportado para o PublicModule reaproveitar (leitura anônima de cores/logo para
  // a tela de login e o portal público).
  exports: [SystemAppearanceService, PortalAppearanceService],
})
export class AppearanceModule {}
