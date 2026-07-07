import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dossie, Department } from '@ged/database';
import { DossiesRepository } from './dossies.repository';
import { DossiesService, DOSSIE_REPOSITORY } from './dossies.service';
import { DossiesController } from './dossies.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@NestModule({
  imports: [TypeOrmModule.forFeature([Dossie, Department]), AuditLogsModule],
  controllers: [DossiesController],
  providers: [
    { provide: DOSSIE_REPOSITORY, useClass: DossiesRepository },
    DossiesService,
    RolesGuard,
  ],
  exports: [DossiesService],
})
export class DossiesModule {}
