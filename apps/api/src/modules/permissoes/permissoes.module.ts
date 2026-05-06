import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permissao } from '@ged/database';
import { PermissoesRepository } from './permissoes.repository';
import { PermissoesService, PERMISSAO_REPOSITORY } from './permissoes.service';
import { PermissoesController } from './permissoes.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Permissao])],
  controllers: [PermissoesController],
  providers: [
    { provide: PERMISSAO_REPOSITORY, useClass: PermissoesRepository },
    PermissoesService,
    RolesGuard,
  ],
  exports: [PermissoesService],
})
export class PermissoesModule {}
