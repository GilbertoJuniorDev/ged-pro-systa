import {
  BadRequestException,
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
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Readable } from 'node:stream';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

// Multer decorators evaluate at class-definition time (before Nest DI is up), so this
// reads STORAGE_MAX_FILE_SIZE directly from process.env rather than via ConfigService.
const MAX_FILE_SIZE = Number(process.env['STORAGE_MAX_FILE_SIZE']) || 26_214_400;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain',
];

interface PaginatedDocumentResponse {
  readonly data: DocumentResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List documents' })
  @ApiResponse({ status: 200, description: 'Documents listed successfully' })
  async findAll(
    @Query() query: QueryDocumentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedDocumentResponse> {
    const { data, total, page, limit } = await this.documentsService.findAll(query, user);
    return {
      data: data.map((document) => this.documentsService.toResponseDto(document)),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document found' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findOne(id, user);
    return this.documentsService.toResponseDto(document);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the document file' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { document, stream } = await this.documentsService.getDownload(id, user);
    res.set({
      'Content-Type': document.arquivoMimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(document.arquivoNome)}"`,
    });
    // IStorageService types this as the generic NodeJS.ReadableStream, but the concrete
    // implementation (GoogleDriveStorageService, using googleapis with responseType:
    // 'stream') always hands back a real Node Readable — StreamableFile requires that
    // concrete type.
    return new StreamableFile(stream as Readable);
  }

  @Post()
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Tipo de arquivo não permitido'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file, departamento, série or dossiê' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentResponseDto> {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    const document = await this.documentsService.upload({ ...dto, actingUser: currentUser }, file);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: document.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: document.id,
        nome: document.nome,
        departamentoId: document.departamentoId,
        serieId: document.serieId,
        dossieId: document.dossieId,
        confidencialidade: document.confidencialidade,
        arquivoNome: document.arquivoNome,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.documentsService.toResponseDto(document);
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 400, description: 'Invalid série or dossiê' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const before = await this.documentsService.findOne(id);
    const document = await this.documentsService.update(id, dto, currentUser);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: document.id,
      dadosAnteriores: {
        nome: before.nome,
        descricao: before.descricao,
        confidencialidade: before.confidencialidade,
        serieId: before.serieId,
        dossieId: before.dossieId,
        isActive: before.isActive,
      },
      dadosNovos: {
        nome: document.nome,
        descricao: document.descricao,
        confidencialidade: document.confidencialidade,
        serieId: document.serieId,
        dossieId: document.dossieId,
        isActive: document.isActive,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.documentsService.toResponseDto(document);
  }

  @Patch(':id/transferir')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @ApiOperation({ summary: 'Transfer document from fase CORRENTE to INTERMEDIARIO' })
  @ApiResponse({ status: 200, description: 'Document transferred successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 409, description: 'Document is not in fase CORRENTE' })
  async transferir(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.transferir(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'TRANSFERIR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: document.id,
      dadosAnteriores: { fase: 'CORRENTE' },
      dadosNovos: {
        fase: 'INTERMEDIARIO',
        faseIntermediarioDesde: document.faseIntermediarioDesde,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.documentsService.toResponseDto(document);
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.documentsService.findOne(id);
    await this.documentsService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_DOCUMENTO',
      entidade: 'Document',
      entidadeId: id,
      dadosAnteriores: {
        nome: before.nome,
        arquivoNome: before.arquivoNome,
        departamentoId: before.departamentoId,
        serieId: before.serieId,
        dossieId: before.dossieId,
      },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
