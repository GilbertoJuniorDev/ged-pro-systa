import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from '@ged/database';
import { ModulosRepository } from './modulos.repository';
import { ModulosService, MODULO_REPOSITORY } from './modulos.service';
import { ModulosController } from './modulos.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo])],
  controllers: [ModulosController],
  providers: [
    { provide: MODULO_REPOSITORY, useClass: ModulosRepository },
    ModulosService,
    RolesGuard,
  ],
  exports: [ModulosService],
})
export class ModulosModule {}
