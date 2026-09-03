import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import type { Arquivo } from '@ged/database';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ArquivosService } from './arquivos.service';
import { CreateArquivoDto } from './dto/create-arquivo.dto';
import { UpdateArquivoDto } from './dto/update-arquivo.dto';
import { ArquivoResponseDto } from './dto/arquivo-response.dto';
import { QueryArquivoDto } from './dto/query-arquivo.dto';

interface PaginatedArquivoResponse {
  readonly data: ArquivoResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@ApiTags('arquivos')
@ApiBearerAuth()
@Controller('arquivos')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ArquivosController {
  constructor(
    private readonly arquivosService: ArquivosService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async toResponse(arquivo: Arquivo): Promise<ArquivoResponseDto> {
    const [departamentoIds, dossiesCount] = await Promise.all([
      this.arquivosService.findDepartamentoIds(arquivo.id),
      this.arquivosService.countDossiesByArquivo([arquivo.id]),
    ]);
    return new ArquivoResponseDto({
      ...arquivo,
      departamentoIds,
      dossiesCount: dossiesCount.get(arquivo.id) ?? 0,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all arquivos' })
  @ApiResponse({ status: 200, description: 'Arquivos listed successfully' })
  async findAll(
    @Query() query: QueryArquivoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedArquivoResponse> {
    const result = await this.arquivosService.findAll(query, user);
    const ids = result.data.map((arquivo) => arquivo.id);
    const [departamentoIdsByArquivo, dossiesCountByArquivo] = await Promise.all([
      this.arquivosService.findDepartamentoIdsByArquivos(ids),
      this.arquivosService.countDossiesByArquivo(ids),
    ]);
    const data = result.data.map(
      (arquivo) =>
        new ArquivoResponseDto({
          ...arquivo,
          departamentoIds: departamentoIdsByArquivo.get(arquivo.id) ?? [],
          dossiesCount: dossiesCountByArquivo.get(arquivo.id) ?? 0,
        }),
    );
    return { data, total: result.total, page: result.page, limit: result.limit };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get arquivo by ID' })
  @ApiResponse({ status: 200, description: 'Arquivo found' })
  @ApiResponse({ status: 404, description: 'Arquivo not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ArquivoResponseDto> {
    const arquivo = await this.arquivosService.findOne(id, user);
    return this.toResponse(arquivo);
  }

  @Post()
  @Permissions('ARQUIVOS_MANAGE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new arquivo' })
  @ApiResponse({ status: 201, description: 'Arquivo created successfully' })
  @ApiResponse({ status: 400, description: 'Departamento não encontrado' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateArquivoDto,
  ): Promise<ArquivoResponseDto> {
    const arquivo = await this.arquivosService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_ARQUIVO',
      entidade: 'Arquivo',
      entidadeId: arquivo.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: arquivo.id,
        codigo: arquivo.codigo,
        nome: arquivo.nome,
        departamentoId: arquivo.departamentoId,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.toResponse(arquivo);
  }

  @Patch(':id')
  @Permissions('ARQUIVOS_MANAGE')
  @ApiOperation({ summary: 'Update an arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo updated successfully' })
  @ApiResponse({ status: 404, description: 'Arquivo not found' })
  @ApiResponse({ status: 409, description: 'Arquivo encerrado' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateArquivoDto,
  ): Promise<ArquivoResponseDto> {
    const before = await this.arquivosService.findOne(id);
    const arquivo = await this.arquivosService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_ARQUIVO',
      entidade: 'Arquivo',
      entidadeId: arquivo.id,
      dadosAnteriores: { id: before.id, nome: before.nome, descricao: before.descricao },
      dadosNovos: { id: arquivo.id, nome: arquivo.nome, descricao: arquivo.descricao },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.toResponse(arquivo);
  }

  @Patch(':id/encerrar')
  @Permissions('ARQUIVOS_MANAGE')
  @ApiOperation({ summary: 'Encerrar um arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo encerrado com sucesso' })
  @ApiResponse({ status: 409, description: 'Arquivo já está encerrado' })
  async encerrar(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<ArquivoResponseDto> {
    const before = await this.arquivosService.findOne(id);
    const arquivo = await this.arquivosService.encerrar(id, currentUser);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ENCERRAR_ARQUIVO',
      entidade: 'Arquivo',
      entidadeId: arquivo.id,
      dadosAnteriores: { status: before.status },
      dadosNovos: { status: arquivo.status, dataEncerramento: arquivo.dataEncerramento },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.toResponse(arquivo);
  }

  @Patch(':id/reabrir')
  @Permissions('ARQUIVOS_MANAGE')
  @ApiOperation({ summary: 'Reabrir um arquivo encerrado' })
  @ApiResponse({ status: 200, description: 'Arquivo reaberto com sucesso' })
  @ApiResponse({ status: 409, description: 'Arquivo já está aberto' })
  async reabrir(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<ArquivoResponseDto> {
    const before = await this.arquivosService.findOne(id);
    const arquivo = await this.arquivosService.reabrir(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'REABRIR_ARQUIVO',
      entidade: 'Arquivo',
      entidadeId: arquivo.id,
      dadosAnteriores: { status: before.status },
      dadosNovos: { status: arquivo.status },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.toResponse(arquivo);
  }

  @Delete(':id')
  @Permissions('ARQUIVOS_MANAGE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an arquivo' })
  @ApiResponse({ status: 204, description: 'Arquivo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Arquivo not found' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.arquivosService.findOne(id);
    await this.arquivosService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'REMOVER_ARQUIVO',
      entidade: 'Arquivo',
      entidadeId: id,
      dadosAnteriores: { id: before.id, codigo: before.codigo, nome: before.nome },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
