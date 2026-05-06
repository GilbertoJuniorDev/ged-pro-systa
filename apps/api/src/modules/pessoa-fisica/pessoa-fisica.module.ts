import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endereco, PessoaFisica, Telefone } from '@ged/database';
import { PessoaFisicaRepository } from './pessoa-fisica.repository';
import { EnderecoRepository } from './endereco.repository';
import { TelefoneRepository } from './telefone.repository';
import {
  PessoaFisicaService,
  PESSOA_FISICA_REPOSITORY,
  ENDERECO_REPOSITORY,
  TELEFONE_REPOSITORY,
} from './pessoa-fisica.service';
import { PessoaFisicaController } from './pessoa-fisica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PessoaFisica, Endereco, Telefone])],
  controllers: [PessoaFisicaController],
  providers: [
    { provide: PESSOA_FISICA_REPOSITORY, useClass: PessoaFisicaRepository },
    { provide: ENDERECO_REPOSITORY, useClass: EnderecoRepository },
    { provide: TELEFONE_REPOSITORY, useClass: TelefoneRepository },
    PessoaFisicaService,
  ],
  exports: [PessoaFisicaService],
})
export class PessoaFisicaModule {}
