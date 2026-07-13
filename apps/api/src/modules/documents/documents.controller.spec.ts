import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException, StreamableFile } from '@nestjs/common';
import { ROLE, CONFIDENCIALIDADE, DOCUMENT_FASE } from '@ged/database';
import type { Document } from '@ged/database';
import type { Response } from 'express';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import type { CreateDocumentDto } from './dto/create-document.dto';
import type { UpdateDocumentDto } from './dto/update-document.dto';

const makeDocument = (overrides: Partial<Document> = {}): Document =>
  ({
    id: 'doc-1',
    nome: 'Contrato',
    descricao: null,
    validade: null,
    confidencialidade: CONFIDENCIALIDADE.RESTRITO,
    departamentoId: 'dept-1',
    serieId: 'serie-1',
    dossieId: null,
    fase: DOCUMENT_FASE.CORRENTE,
    faseCorrenteDesde: new Date('2026-01-01'),
    faseIntermediarioDesde: null,
    arquivoNome: 'contrato.pdf',
    arquivoChave: 'drive-file-id',
    arquivoMimeType: 'application/pdf',
    arquivoTamanho: 1024,
    isActive: true,
    destaque: false,
    exigeCadastro: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Document;

const makeResponseDto = (overrides: Partial<DocumentResponseDto> = {}): DocumentResponseDto =>
  new DocumentResponseDto({
    id: 'doc-1',
    nome: 'Contrato',
    descricao: null,
    validade: null,
    confidencialidade: CONFIDENCIALIDADE.RESTRITO,
    departamentoId: 'dept-1',
    serieId: 'serie-1',
    dossieId: null,
    fase: DOCUMENT_FASE.CORRENTE,
    faseCorrenteDesde: new Date('2026-01-01'),
    faseIntermediarioDesde: null,
    arquivoNome: 'contrato.pdf',
    arquivoMimeType: 'application/pdf',
    arquivoTamanho: 1024,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    vencimentoCorrente: new Date('2026-07-01'),
    vencimentoIntermediario: null,
    elegivelTransferencia: false,
    destaque: false,
    exigeCadastro: false,
    ...overrides,
  });

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'admin-uuid',
  email: 'admin@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeHttpRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
  ...overrides,
});

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: jest.Mocked<DocumentsService>;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    const mockDocumentsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      upload: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      transferir: jest.fn(),
      getDownload: jest.fn(),
      toResponseDto: jest.fn(),
    };

    auditLogsService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    controller = module.get(DocumentsController);
    documentsService = module.get(DocumentsService) as jest.Mocked<DocumentsService>;
  });

  describe('findAll', () => {
    it('returns paginated documents mapped through toResponseDto', async () => {
      const documents = [makeDocument()];
      documentsService.findAll.mockResolvedValue({ data: documents, total: 1, page: 1, limit: 20 });
      documentsService.toResponseDto.mockReturnValue(makeResponseDto());

      const result = await controller.findAll({}, makeJwtPayload());

      expect(result).toEqual({ data: [makeResponseDto()], total: 1, page: 1, limit: 20 });
      expect(documentsService.findAll).toHaveBeenCalledWith({}, makeJwtPayload());
      expect(documentsService.toResponseDto).toHaveBeenCalledWith(documents[0]);
    });
  });

  describe('findOne', () => {
    it('returns a document by id', async () => {
      const document = makeDocument();
      documentsService.findOne.mockResolvedValue(document);
      documentsService.toResponseDto.mockReturnValue(makeResponseDto());

      const result = await controller.findOne('doc-1', makeJwtPayload());

      expect(result.id).toBe('doc-1');
      expect(documentsService.findOne).toHaveBeenCalledWith('doc-1', makeJwtPayload());
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('missing', makeJwtPayload())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto: CreateDocumentDto = {
      nome: 'Contrato',
      confidencialidade: CONFIDENCIALIDADE.RESTRITO,
      departamentoId: 'dept-1',
      serieId: 'serie-1',
    };
    const file = { originalname: 'contrato.pdf' } as Express.Multer.File;

    it('uploads a document and logs the action', async () => {
      const created = makeDocument();
      documentsService.upload.mockResolvedValue(created);
      documentsService.toResponseDto.mockReturnValue(makeResponseDto());

      const result = await controller.create(makeHttpRequest(), makeJwtPayload(), dto, file);

      expect(result.id).toBe('doc-1');
      expect(documentsService.upload).toHaveBeenCalledWith(
        { ...dto, actingUser: makeJwtPayload() },
        file,
      );
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_DOCUMENTO',
          entidade: 'Document',
          entidadeId: 'doc-1',
        }),
      );
    });

    it('carries destaque and exigeCadastro through to the response when set on upload', async () => {
      const dtoWithFlags: CreateDocumentDto = { ...dto, destaque: true, exigeCadastro: true };
      const created = makeDocument({ destaque: true, exigeCadastro: true });
      documentsService.upload.mockResolvedValue(created);
      documentsService.toResponseDto.mockReturnValue(
        makeResponseDto({ destaque: true, exigeCadastro: true }),
      );

      const result = await controller.create(
        makeHttpRequest(),
        makeJwtPayload(),
        dtoWithFlags,
        file,
      );

      expect(documentsService.upload).toHaveBeenCalledWith(
        { ...dtoWithFlags, actingUser: makeJwtPayload() },
        file,
      );
      expect(result.destaque).toBe(true);
      expect(result.exigeCadastro).toBe(true);
    });

    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        controller.create(
          makeHttpRequest(),
          makeJwtPayload(),
          dto,
          undefined as unknown as Express.Multer.File,
        ),
      ).rejects.toThrow(new BadRequestException('Arquivo é obrigatório'));
      expect(documentsService.upload).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when upload fails validation, without logging', async () => {
      documentsService.upload.mockRejectedValue(new BadRequestException('Departamento não encontrado'));

      await expect(
        controller.create(makeHttpRequest(), makeJwtPayload(), dto, file),
      ).rejects.toThrow(BadRequestException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a document and logs before/after data', async () => {
      const before = makeDocument();
      const updated = makeDocument({ nome: 'Contrato Renovado' });
      documentsService.findOne.mockResolvedValue(before);
      documentsService.update.mockResolvedValue(updated);
      documentsService.toResponseDto.mockReturnValue(makeResponseDto({ nome: 'Contrato Renovado' }));
      const dto: UpdateDocumentDto = { nome: 'Contrato Renovado' };

      const result = await controller.update(makeHttpRequest(), makeJwtPayload(), 'doc-1', dto);

      expect(result.nome).toBe('Contrato Renovado');
      expect(documentsService.update).toHaveBeenCalledWith('doc-1', dto, makeJwtPayload());
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'ATUALIZAR_DOCUMENTO',
          entidade: 'Document',
          entidadeId: 'doc-1',
          dadosAnteriores: expect.objectContaining({ nome: 'Contrato' }),
          dadosNovos: expect.objectContaining({ nome: 'Contrato Renovado' }),
        }),
      );
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(makeHttpRequest(), makeJwtPayload(), 'missing', {}),
      ).rejects.toThrow(NotFoundException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('carries destaque and exigeCadastro through to the response when updated', async () => {
      const before = makeDocument();
      const updated = makeDocument({ destaque: true, exigeCadastro: true });
      documentsService.findOne.mockResolvedValue(before);
      documentsService.update.mockResolvedValue(updated);
      documentsService.toResponseDto.mockReturnValue(
        makeResponseDto({ destaque: true, exigeCadastro: true }),
      );
      const dto: UpdateDocumentDto = { destaque: true, exigeCadastro: true };

      const result = await controller.update(makeHttpRequest(), makeJwtPayload(), 'doc-1', dto);

      expect(documentsService.update).toHaveBeenCalledWith('doc-1', dto, makeJwtPayload());
      expect(result.destaque).toBe(true);
      expect(result.exigeCadastro).toBe(true);
    });
  });

  describe('transferir', () => {
    it('transfers the document and logs the action', async () => {
      const transferred = makeDocument({
        fase: DOCUMENT_FASE.INTERMEDIARIO,
        faseIntermediarioDesde: new Date('2026-07-06'),
      });
      documentsService.transferir.mockResolvedValue(transferred);
      documentsService.toResponseDto.mockReturnValue(
        makeResponseDto({ fase: DOCUMENT_FASE.INTERMEDIARIO }),
      );

      const result = await controller.transferir(makeHttpRequest(), makeJwtPayload(), 'doc-1');

      expect(documentsService.transferir).toHaveBeenCalledWith('doc-1');
      expect(result.fase).toBe(DOCUMENT_FASE.INTERMEDIARIO);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'TRANSFERIR_DOCUMENTO',
          entidade: 'Document',
          entidadeId: 'doc-1',
          dadosAnteriores: { fase: 'CORRENTE' },
        }),
      );
    });

    it('throws ConflictException when the document is not in fase CORRENTE', async () => {
      documentsService.transferir.mockRejectedValue(
        new ConflictException('Documento não está na fase corrente'),
      );

      await expect(
        controller.transferir(makeHttpRequest(), makeJwtPayload(), 'doc-1'),
      ).rejects.toThrow(ConflictException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a document and logs the action', async () => {
      documentsService.findOne.mockResolvedValue(makeDocument());
      documentsService.remove.mockResolvedValue(undefined);

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'doc-1'),
      ).resolves.toBeUndefined();
      expect(documentsService.remove).toHaveBeenCalledWith('doc-1');
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETAR_DOCUMENTO',
          entidade: 'Document',
          entidadeId: 'doc-1',
          dadosNovos: null,
        }),
      );
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'missing'),
      ).rejects.toThrow(NotFoundException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('sets response headers and returns a StreamableFile', async () => {
      const document = makeDocument();
      const stream = {} as NodeJS.ReadableStream;
      documentsService.getDownload.mockResolvedValue({ document, stream });
      const res = { set: jest.fn() } as unknown as Response;

      const result = await controller.download('doc-1', makeJwtPayload(), res);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato.pdf"`,
      });
      expect(documentsService.getDownload).toHaveBeenCalledWith('doc-1', makeJwtPayload());
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentsService.getDownload.mockRejectedValue(new NotFoundException());
      const res = { set: jest.fn() } as unknown as Response;

      await expect(controller.download('missing', makeJwtPayload(), res)).rejects.toThrow(
        NotFoundException,
      );
      expect(res.set).not.toHaveBeenCalled();
    });
  });
});
