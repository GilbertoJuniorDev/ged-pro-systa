import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Document, DocumentLead, TIPO_DOCUMENTO } from '@ged/database';
import type { PublicDocumentDto, RegisterAccessInput, RegisterAccessResult } from '@ged/types';
import { stripCnpjMask, stripCpfMask } from '@ged/utils';
import { STORAGE_SERVICE } from '../storage/interfaces/storage.interface';
import type { IStorageService } from '../storage/interfaces/storage.interface';
import {
  PublicDocumentsRepository,
  type PaginatedPublicDocuments,
  type PublicDocumentQueryFilter,
} from './public-documents.repository';
import { PublicDocumentResponseDto } from './dto/public-document-response.dto';

export interface PaginatedPublicDocumentDtos {
  readonly data: PublicDocumentDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface RegisterAccessMeta {
  readonly ipCliente: string | null;
  readonly userAgent: string | null;
}

export interface PublicDownload {
  readonly document: Document;
  readonly stream: NodeJS.ReadableStream;
}

const DOWNLOAD_TOKEN_SCOPE = 'portal-download';
const DOWNLOAD_TOKEN_TTL = '10m';

// Payload assinado exclusivamente por registrarAcesso() abaixo, com exatamente este
// formato. Não decodifica/aceita tokens de nenhuma outra origem.
interface DownloadTokenPayload {
  readonly sub: string;
  readonly scope: string;
}

@Injectable()
export class PublicDocumentsService {
  constructor(
    private readonly publicDocumentsRepository: PublicDocumentsRepository,
    @InjectRepository(DocumentLead)
    private readonly documentLeadRepo: Repository<DocumentLead>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    private readonly jwtService: JwtService,
  ) {}

  async listar(filtro: PublicDocumentQueryFilter): Promise<PaginatedPublicDocumentDtos> {
    const result: PaginatedPublicDocuments = await this.publicDocumentsRepository.listar(filtro);
    return {
      data: result.data.map((document) => this.toPublicDto(document)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async destaques(): Promise<PublicDocumentDto[]> {
    const documents = await this.publicDocumentsRepository.destaques();
    return documents.map((document) => this.toPublicDto(document));
  }

  async recentes(limit?: number): Promise<PublicDocumentDto[]> {
    const documents = await this.publicDocumentsRepository.recentes(limit);
    return documents.map((document) => this.toPublicDto(document));
  }

  // 404 tanto para documento inexistente quanto para documento existente mas não
  // PUBLICO/isActive — a mensagem não distingue os dois casos, para não confirmar a
  // existência de um documento não-público a um visitante não autenticado.
  async buscarPorId(id: string): Promise<PublicDocumentDto> {
    const document = await this.publicDocumentsRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    return this.toPublicDto(document);
  }

  async registrarAcesso(
    id: string,
    dto: RegisterAccessInput,
    meta: RegisterAccessMeta,
  ): Promise<RegisterAccessResult> {
    const document = await this.publicDocumentsRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Persistimos o documento (CPF/CNPJ) sem máscara — dígitos puros, não o valor exibido.
    const documentoStripped =
      dto.tipoDocumento === TIPO_DOCUMENTO.CPF
        ? stripCpfMask(dto.documento)
        : stripCnpjMask(dto.documento);

    const lead = this.documentLeadRepo.create({
      email: dto.email,
      nome: dto.nome,
      documento: documentoStripped,
      tipoDocumento: dto.tipoDocumento,
      documentId: document.id,
      ipCliente: meta.ipCliente,
      userAgent: meta.userAgent,
    });
    await this.documentLeadRepo.save(lead);

    const downloadToken = await this.jwtService.signAsync(
      { sub: document.id, scope: DOWNLOAD_TOKEN_SCOPE },
      { expiresIn: DOWNLOAD_TOKEN_TTL },
    );

    return { downloadToken };
  }

  async getDownload(id: string, token?: string): Promise<PublicDownload> {
    const document = await this.publicDocumentsRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.exigeCadastro) {
      await this.assertValidDownloadToken(id, token);
    }

    const stream = await this.storageService.getStream(document.arquivoChave);
    return { document, stream };
  }

  private async assertValidDownloadToken(documentId: string, token?: string): Promise<void> {
    if (!token) {
      throw new ForbiddenException('Token de acesso obrigatório para este documento');
    }

    let payload: DownloadTokenPayload;
    try {
      // O generic apenas anota o formato que ESTE service sempre assina em
      // registrarAcesso(); verifyAsync já garante (via exceção em caso contrário) que a
      // assinatura (JWT_SECRET) e a expiração (10 min) são válidas antes de chegarmos
      // aqui — não é uma suposição não verificada sobre um payload externo.
      payload = await this.jwtService.verifyAsync<DownloadTokenPayload>(token);
    } catch {
      // Nunca vaza o erro cru da lib de JWT (expirado/malformado/assinatura errada) —
      // todos os casos de verificação falha viram o mesmo 403 genérico.
      throw new ForbiddenException('Token de acesso inválido ou expirado');
    }

    // O token precisa ser escopado a ESTE documento: um token emitido para o documento A
    // não pode liberar o download do documento B (reuso entre documentos).
    if (payload.scope !== DOWNLOAD_TOKEN_SCOPE || payload.sub !== documentId) {
      throw new ForbiddenException('Token de acesso inválido para este documento');
    }
  }

  // Monta a projeção pública campo-a-campo — nunca `{ ...document }`. `arquivoChave`
  // (chave interna do storage) e `departamentoId` nunca são lidos aqui, então não podem
  // vazar para a resposta HTTP.
  private toPublicDto(document: Document): PublicDocumentDto {
    if (!document.serie) {
      throw new Error(
        `Documento público ${document.id} carregado sem a série associada (serieId=${document.serieId})`,
      );
    }
    return new PublicDocumentResponseDto({
      id: document.id,
      nome: document.nome,
      descricao: document.descricao,
      arquivoNome: document.arquivoNome,
      arquivoMimeType: document.arquivoMimeType,
      arquivoTamanho: document.arquivoTamanho,
      serie: {
        id: document.serie.id,
        codigo: document.serie.codigo,
        nome: document.serie.nome,
      },
      destaque: document.destaque,
      exigeCadastro: document.exigeCadastro,
      createdAt: document.createdAt,
    });
  }
}
