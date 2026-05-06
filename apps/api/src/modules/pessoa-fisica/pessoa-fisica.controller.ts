import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SEXO, TIPO_ENDERECO, TIPO_TELEFONE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PessoaFisicaService } from './pessoa-fisica.service';
import { CreatePessoaFisicaDto } from './dto/create-pessoa-fisica.dto';
import { UpdatePessoaFisicaDto } from './dto/update-pessoa-fisica.dto';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { CreateTelefoneDto } from './dto/create-telefone.dto';
import { UpdateTelefoneDto } from './dto/update-telefone.dto';
import {
  EnderecoResponseDto,
  PessoaFisicaResponseDto,
  TelefoneResponseDto,
} from './dto/pessoa-fisica-response.dto';

@Controller('users/:userId/pessoa-fisica')
@UseGuards(JwtAuthGuard)
export class PessoaFisicaController {
  constructor(private readonly pessoaFisicaService: PessoaFisicaService) {}

  // ── PessoaFisica ────────────────────────────────────────────────

  @Get()
  async findOne(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PessoaFisicaResponseDto> {
    // A verificação de acesso (próprio ou ADMIN) é delegada ao service
    const pf = await this.pessoaFisicaService.findByUserId(userId);
    if (user.role !== 'ADMIN' && user.sub !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return new PessoaFisicaResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('userId') userId: string,
    @Body() dto: CreatePessoaFisicaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PessoaFisicaResponseDto> {
    const pf = await this.pessoaFisicaService.create(user.sub, user.role, userId, {
      userId,
      nome: dto.nome,
      sobrenome: dto.sobrenome,
      cpf: dto.cpf,
      dataNascimento: new Date(dto.dataNascimento),
      sexo: SEXO[dto.sexo as keyof typeof SEXO] ?? dto.sexo,
    });
    return new PessoaFisicaResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  @Patch()
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdatePessoaFisicaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PessoaFisicaResponseDto> {
    const pf = await this.pessoaFisicaService.update(user.sub, user.role, userId, {
      nome: dto.nome,
      sobrenome: dto.sobrenome,
      dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      sexo: dto.sexo,
    });
    return new PessoaFisicaResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  // ── Endereços ────────────────────────────────────────────────────

  @Get('enderecos')
  async findEnderecos(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EnderecoResponseDto[]> {
    const enderecos = await this.pessoaFisicaService.findEnderecos(user.sub, user.role, userId);
    return enderecos.map((e) =>
      new EnderecoResponseDto({
        id: e.id,
        pessoaFisicaId: e.pessoaFisicaId,
        tipo: e.tipo,
        logradouro: e.logradouro,
        numero: e.numero,
        complemento: e.complemento,
        bairro: e.bairro,
        cidade: e.cidade,
        estado: e.estado,
        cep: e.cep,
        createdAt: e.createdAt,
      }),
    );
  }

  @Post('enderecos')
  @HttpCode(HttpStatus.CREATED)
  async createEndereco(
    @Param('userId') userId: string,
    @Body() dto: CreateEnderecoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<EnderecoResponseDto> {
    const e = await this.pessoaFisicaService.createEndereco(user.sub, user.role, userId, {
      tipo: TIPO_ENDERECO[dto.tipo as keyof typeof TIPO_ENDERECO] ?? dto.tipo,
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento ?? null,
      bairro: dto.bairro,
      cidade: dto.cidade,
      estado: dto.estado,
      cep: dto.cep,
    });
    return new EnderecoResponseDto({
      id: e.id,
      pessoaFisicaId: e.pessoaFisicaId,
      tipo: e.tipo,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      cep: e.cep,
      createdAt: e.createdAt,
    });
  }

  @Patch('enderecos/:enderecoId')
  async updateEndereco(
    @Param('userId') userId: string,
    @Param('enderecoId') enderecoId: string,
    @Body() dto: UpdateEnderecoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<EnderecoResponseDto> {
    const e = await this.pessoaFisicaService.updateEndereco(
      user.sub, user.role, userId, enderecoId, dto,
    );
    return new EnderecoResponseDto({
      id: e.id,
      pessoaFisicaId: e.pessoaFisicaId,
      tipo: e.tipo,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      cep: e.cep,
      createdAt: e.createdAt,
    });
  }

  @Delete('enderecos/:enderecoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEndereco(
    @Param('userId') userId: string,
    @Param('enderecoId') enderecoId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.pessoaFisicaService.removeEndereco(user.sub, user.role, userId, enderecoId);
  }

  // ── Telefones ────────────────────────────────────────────────────

  @Get('telefones')
  async findTelefones(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TelefoneResponseDto[]> {
    const telefones = await this.pessoaFisicaService.findTelefones(user.sub, user.role, userId);
    return telefones.map((t) =>
      new TelefoneResponseDto({
        id: t.id,
        pessoaFisicaId: t.pessoaFisicaId,
        tipo: t.tipo,
        numero: t.numero,
        createdAt: t.createdAt,
      }),
    );
  }

  @Post('telefones')
  @HttpCode(HttpStatus.CREATED)
  async createTelefone(
    @Param('userId') userId: string,
    @Body() dto: CreateTelefoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TelefoneResponseDto> {
    const t = await this.pessoaFisicaService.createTelefone(user.sub, user.role, userId, {
      tipo: TIPO_TELEFONE[dto.tipo as keyof typeof TIPO_TELEFONE] ?? dto.tipo,
      numero: dto.numero,
    });
    return new TelefoneResponseDto({
      id: t.id,
      pessoaFisicaId: t.pessoaFisicaId,
      tipo: t.tipo,
      numero: t.numero,
      createdAt: t.createdAt,
    });
  }

  @Patch('telefones/:telefoneId')
  async updateTelefone(
    @Param('userId') userId: string,
    @Param('telefoneId') telefoneId: string,
    @Body() dto: UpdateTelefoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TelefoneResponseDto> {
    const t = await this.pessoaFisicaService.updateTelefone(
      user.sub, user.role, userId, telefoneId, dto,
    );
    return new TelefoneResponseDto({
      id: t.id,
      pessoaFisicaId: t.pessoaFisicaId,
      tipo: t.tipo,
      numero: t.numero,
      createdAt: t.createdAt,
    });
  }

  @Delete('telefones/:telefoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTelefone(
    @Param('userId') userId: string,
    @Param('telefoneId') telefoneId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.pessoaFisicaService.removeTelefone(user.sub, user.role, userId, telefoneId);
  }
}
