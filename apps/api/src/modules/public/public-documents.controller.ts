import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Readable } from 'node:stream';
import type { Response } from 'express';
import type { PublicDocumentDto, RegisterAccessResult } from '@ged/types';
import { Public } from '../../common/decorators/public.decorator';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { PublicDocumentsService, type PaginatedPublicDocumentDtos } from './public-documents.service';
import { QueryPublicDocumentsDto, QueryRecentesDto } from './dto/query-public-documents.dto';
import { RegisterAccessDto } from './dto/register-access.dto';

// Rotas de navegação (listar/destaques/recentes/detalhe) são leitura pública generosa.
const BROWSE_THROTTLE = { default: { limit: 30, ttl: 60_000 } };
// Chokepoint anti-scraping/anti-abuso: grava um lead e emite um token a cada chamada.
const ACESSO_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
// Download efetivo do arquivo — mais permissivo que /acesso, mais restrito que a navegação.
const DOWNLOAD_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('public-documents')
@Controller('public/documents')
export class PublicDocumentsController {
  constructor(private readonly publicDocumentsService: PublicDocumentsService) {}

  @Public()
  @Throttle(BROWSE_THROTTLE)
  @Get()
  @ApiOperation({ summary: 'Listar documentos públicos' })
  @ApiResponse({ status: 200, description: 'Documentos públicos listados com sucesso' })
  listar(@Query() query: QueryPublicDocumentsDto): Promise<PaginatedPublicDocumentDtos> {
    return this.publicDocumentsService.listar(query);
  }

  @Public()
  @Throttle(BROWSE_THROTTLE)
  @Get('destaques')
  @ApiOperation({ summary: 'Listar documentos públicos em destaque' })
  @ApiResponse({ status: 200, description: 'Documentos em destaque listados com sucesso' })
  destaques(): Promise<PublicDocumentDto[]> {
    return this.publicDocumentsService.destaques();
  }

  @Public()
  @Throttle(BROWSE_THROTTLE)
  @Get('recentes')
  @ApiOperation({ summary: 'Listar documentos públicos recentes' })
  @ApiResponse({ status: 200, description: 'Documentos recentes listados com sucesso' })
  recentes(@Query() query: QueryRecentesDto): Promise<PublicDocumentDto[]> {
    return this.publicDocumentsService.recentes(query.limit);
  }

  @Public()
  @Throttle(BROWSE_THROTTLE)
  @Get(':id')
  @ApiOperation({ summary: 'Obter um documento público por id' })
  @ApiResponse({ status: 200, description: 'Documento público encontrado' })
  @ApiResponse({ status: 404, description: 'Documento público não encontrado' })
  buscarPorId(@Param('id') id: string): Promise<PublicDocumentDto> {
    return this.publicDocumentsService.buscarPorId(id);
  }

  @Public()
  @Throttle(ACESSO_THROTTLE)
  @Post(':id/acesso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar acesso (lead) e obter token de download' })
  @ApiResponse({ status: 200, description: 'Acesso registrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento público não encontrado' })
  registrarAcesso(
    @Param('id') id: string,
    @Body() dto: RegisterAccessDto,
    @Req() req: HttpRequest,
  ): Promise<RegisterAccessResult> {
    return this.publicDocumentsService.registrarAcesso(id, dto, {
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Throttle(DOWNLOAD_THROTTLE)
  @Get(':id/download')
  @ApiOperation({ summary: 'Baixar o arquivo do documento público' })
  @ApiResponse({ status: 200, description: 'Stream do arquivo' })
  @ApiResponse({ status: 403, description: 'Token de download ausente ou inválido' })
  @ApiResponse({ status: 404, description: 'Documento público não encontrado' })
  async download(
    @Param('id') id: string,
    @Query('token') token: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { document, stream } = await this.publicDocumentsService.getDownload(id, token);
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
}
