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
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DossiesService } from './dossies.service';
import { CreateDossieDto } from './dto/create-dossie.dto';
import { UpdateDossieDto } from './dto/update-dossie.dto';
import { DossieResponseDto } from './dto/dossie-response.dto';
import { QueryDossieDto } from './dto/query-dossie.dto';

@ApiTags('dossies')
@ApiBearerAuth()
@Controller('dossies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DossiesController {
  constructor(
    private readonly dossiesService: DossiesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all dossiês' })
  @ApiResponse({ status: 200, description: 'Dossiês listed successfully' })
  async findAll(@Query() query: QueryDossieDto): Promise<DossieResponseDto[]> {
    const dossies = await this.dossiesService.findAll(query.departamentoId);
    return dossies.map((d) => new DossieResponseDto(d));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dossiê by ID' })
  @ApiResponse({ status: 200, description: 'Dossiê found' })
  @ApiResponse({ status: 404, description: 'Dossiê not found' })
  async findOne(@Param('id') id: string): Promise<DossieResponseDto> {
    const dossie = await this.dossiesService.findOne(id);
    return new DossieResponseDto(dossie);
  }

  @Post()
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
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
    return new DossieResponseDto(dossie);
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
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
    return new DossieResponseDto(dossie);
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
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
