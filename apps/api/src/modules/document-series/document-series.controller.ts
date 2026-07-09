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
import { DocumentSeriesService } from './document-series.service';
import { CreateDocumentSeriesDto } from './dto/create-document-series.dto';
import { UpdateDocumentSeriesDto } from './dto/update-document-series.dto';
import { DocumentSeriesResponseDto } from './dto/document-series-response.dto';
import { QueryDocumentSeriesDto } from './dto/query-document-series.dto';

@ApiTags('document-series')
@ApiBearerAuth()
@Controller('document-series')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentSeriesController {
  constructor(
    private readonly documentSeriesService: DocumentSeriesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all document series' })
  @ApiResponse({ status: 200, description: 'Document series listed successfully' })
  async findAll(
    @Query() query: QueryDocumentSeriesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentSeriesResponseDto[]> {
    const documentSeries = await this.documentSeriesService.findAll(
      query.departamentoId,
      user,
    );
    return documentSeries.map((d) => new DocumentSeriesResponseDto(d));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document series by ID' })
  @ApiResponse({ status: 200, description: 'Document series found' })
  @ApiResponse({ status: 404, description: 'Document series not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentSeriesResponseDto> {
    const documentSeries = await this.documentSeriesService.findOne(id, user);
    return new DocumentSeriesResponseDto(documentSeries);
  }

  @Post()
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new document series' })
  @ApiResponse({ status: 201, description: 'Document series created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid department or parent series' })
  @ApiResponse({ status: 409, description: 'Codigo already exists in this department' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDocumentSeriesDto,
  ): Promise<DocumentSeriesResponseDto> {
    const documentSeries = await this.documentSeriesService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_SERIE',
      entidade: 'DocumentSeries',
      entidadeId: documentSeries.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: documentSeries.id,
        codigo: documentSeries.codigo,
        nome: documentSeries.nome,
        descricao: documentSeries.descricao,
        prazoCorrenteMeses: documentSeries.prazoCorrenteMeses,
        prazoIntermediarioMeses: documentSeries.prazoIntermediarioMeses,
        destinacaoFinal: documentSeries.destinacaoFinal,
        baseLegal: documentSeries.baseLegal,
        isActive: documentSeries.isActive,
        departamentoId: documentSeries.departamentoId,
        seriePaiId: documentSeries.seriePaiId,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new DocumentSeriesResponseDto(documentSeries);
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @ApiOperation({ summary: 'Update a document series' })
  @ApiResponse({ status: 200, description: 'Document series updated successfully' })
  @ApiResponse({ status: 404, description: 'Document series not found' })
  @ApiResponse({ status: 400, description: 'Invalid parent series' })
  @ApiResponse({ status: 409, description: 'Codigo already exists in this department' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentSeriesDto,
  ): Promise<DocumentSeriesResponseDto> {
    const before = await this.documentSeriesService.findOne(id);
    const documentSeries = await this.documentSeriesService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_SERIE',
      entidade: 'DocumentSeries',
      entidadeId: documentSeries.id,
      dadosAnteriores: {
        id: before.id,
        codigo: before.codigo,
        nome: before.nome,
        descricao: before.descricao,
        prazoCorrenteMeses: before.prazoCorrenteMeses,
        prazoIntermediarioMeses: before.prazoIntermediarioMeses,
        destinacaoFinal: before.destinacaoFinal,
        baseLegal: before.baseLegal,
        isActive: before.isActive,
        departamentoId: before.departamentoId,
        seriePaiId: before.seriePaiId,
      },
      dadosNovos: {
        id: documentSeries.id,
        codigo: documentSeries.codigo,
        nome: documentSeries.nome,
        descricao: documentSeries.descricao,
        prazoCorrenteMeses: documentSeries.prazoCorrenteMeses,
        prazoIntermediarioMeses: documentSeries.prazoIntermediarioMeses,
        destinacaoFinal: documentSeries.destinacaoFinal,
        baseLegal: documentSeries.baseLegal,
        isActive: documentSeries.isActive,
        departamentoId: documentSeries.departamentoId,
        seriePaiId: documentSeries.seriePaiId,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new DocumentSeriesResponseDto(documentSeries);
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document series' })
  @ApiResponse({ status: 204, description: 'Document series deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document series not found' })
  @ApiResponse({ status: 409, description: 'Document series has linked documents' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.documentSeriesService.findOne(id);
    await this.documentSeriesService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_SERIE',
      entidade: 'DocumentSeries',
      entidadeId: id,
      dadosAnteriores: {
        id: before.id,
        codigo: before.codigo,
        nome: before.nome,
        descricao: before.descricao,
        prazoCorrenteMeses: before.prazoCorrenteMeses,
        prazoIntermediarioMeses: before.prazoIntermediarioMeses,
        destinacaoFinal: before.destinacaoFinal,
        baseLegal: before.baseLegal,
        isActive: before.isActive,
        departamentoId: before.departamentoId,
        seriePaiId: before.seriePaiId,
      },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
