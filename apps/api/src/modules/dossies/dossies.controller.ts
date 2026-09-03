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
import type { Dossie } from '@ged/database';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DossiesService } from './dossies.service';
import { CreateDossieDto } from './dto/create-dossie.dto';
import { UpdateDossieDto } from './dto/update-dossie.dto';
import { DossieResponseDto } from './dto/dossie-response.dto';
import { QueryDossieDto } from './dto/query-dossie.dto';

interface PaginatedDossieResponse {
  readonly data: DossieResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@ApiTags('dossies')
@ApiBearerAuth()
@Controller('dossies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DossiesController {
  constructor(
    private readonly dossiesService: DossiesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async toResponse(dossie: Dossie, user: JwtPayload): Promise<DossieResponseDto> {
    const counts = await this.dossiesService.countDocumentsByDossie([dossie.id], user);
    return new DossieResponseDto({ ...dossie, documentsCount: counts.get(dossie.id) ?? 0 });
  }

  @Get()
  @ApiOperation({ summary: 'List all dossiês' })
  @ApiResponse({ status: 200, description: 'Dossiês listed successfully' })
  async findAll(
    @Query() query: QueryDossieDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedDossieResponse> {
    const result = await this.dossiesService.findAll(query, user);
    const counts = await this.dossiesService.countDocumentsByDossie(
      result.data.map((d) => d.id),
      user,
    );
    const data = result.data.map(
      (dossie) =>
        new DossieResponseDto({ ...dossie, documentsCount: counts.get(dossie.id) ?? 0 }),
    );
    return { data, total: result.total, page: result.page, limit: result.limit };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dossiê by ID' })
  @ApiResponse({ status: 200, description: 'Dossiê found' })
  @ApiResponse({ status: 404, description: 'Dossiê not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DossieResponseDto> {
    const dossie = await this.dossiesService.findOne(id, user);
    return this.toResponse(dossie, user);
  }

  @Post()
  @Permissions('DOSSIES_MANAGE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new dossiê' })
  @ApiResponse({ status: 201, description: 'Dossiê created successfully' })
  @ApiResponse({ status: 400, description: 'Departamento não encontrado' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDossieDto,
  ): Promise<DossieResponseDto> {
    const dossie = await this.dossiesService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_DOSSIE',
      entidade: 'Dossie',
      entidadeId: dossie.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: dossie.id,
        nome: dossie.nome,
        descricao: dossie.descricao,
        isActive: dossie.isActive,
        departamentoId: dossie.departamentoId,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new DossieResponseDto({ ...dossie, documentsCount: 0 });
  }

  @Patch(':id')
  @Permissions('DOSSIES_MANAGE')
  @ApiOperation({ summary: 'Update a dossiê' })
  @ApiResponse({ status: 200, description: 'Dossiê updated successfully' })
  @ApiResponse({ status: 404, description: 'Dossiê not found' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDossieDto,
  ): Promise<DossieResponseDto> {
    const before = await this.dossiesService.findOne(id);
    const dossie = await this.dossiesService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_DOSSIE',
      entidade: 'Dossie',
      entidadeId: dossie.id,
      dadosAnteriores: {
        id: before.id,
        nome: before.nome,
        descricao: before.descricao,
        isActive: before.isActive,
        departamentoId: before.departamentoId,
      },
      dadosNovos: {
        id: dossie.id,
        nome: dossie.nome,
        descricao: dossie.descricao,
        isActive: dossie.isActive,
        departamentoId: dossie.departamentoId,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.toResponse(dossie, currentUser);
  }

  @Delete(':id')
  @Permissions('DOSSIES_MANAGE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a dossiê' })
  @ApiResponse({ status: 204, description: 'Dossiê deleted successfully' })
  @ApiResponse({ status: 404, description: 'Dossiê not found' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.dossiesService.findOne(id);
    await this.dossiesService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_DOSSIE',
      entidade: 'Dossie',
      entidadeId: id,
      dadosAnteriores: {
        id: before.id,
        nome: before.nome,
        descricao: before.descricao,
        isActive: before.isActive,
        departamentoId: before.departamentoId,
      },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
