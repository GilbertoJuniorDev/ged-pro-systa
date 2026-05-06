import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from '@ged/database';
import { ModulesRepository } from './modules.repository';
import { ModulesService, MODULE_REPOSITORY } from './modules.service';
import { ModulesController } from './modules.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@NestModule({
  imports: [TypeOrmModule.forFeature([ModuleEntity])],
  controllers: [ModulesController],
  providers: [
    { provide: MODULE_REPOSITORY, useClass: ModulesRepository },
    ModulesService,
    RolesGuard,
  ],
  exports: [ModulesService],
})
export class ModulesModule {}
