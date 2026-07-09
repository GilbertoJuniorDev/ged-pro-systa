import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { CONFIDENCIALIDADE, DocumentLead } from '@ged/database';
import type { Document, DocumentSeries } from '@ged/database';
import { STORAGE_SERVICE, type IStorageService } from '../storage/interfaces/storage.interface';
import { PublicDocumentsRepository } from './public-documents.repository';
import { PublicDocumentsService } from './public-documents.service';

const makeSerie = (overrides: Partial<DocumentSeries> = {}): DocumentSeries =>
  ({
    id: 'serie-1',
    codigo: 'FIN-01',
    nome: 'Contratos financeiros',
    ...overrides,
  }) as DocumentSeries;

const makeDocument = (overrides: Partial<Document> = {}): Document =>
  ({
    id: 'doc-1',
    nome: 'Edital de licitação',
    descricao: 'Descrição pública',
    confidencialidade: CONFIDENCIALIDADE.PUBLICO,
    departamentoId: 'dept-secreto',
    serieId: 'serie-1',
    serie: makeSerie(),
    arquivoNome: 'edital.pdf',
    arquivoChave: 'drive-file-id-secreto',
    arquivoMimeType: 'application/pdf',
    arquivoTamanho: 2048,
    isActive: true,
    destaque: false,
    exigeCadastro: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as Document;

describe('PublicDocumentsService', () => {
  let service: PublicDocumentsService;
  let publicDocumentsRepository: jest.Mocked<
    Pick<PublicDocumentsRepository, 'listar' | 'destaques' | 'recentes' | 'findById'>
  >;
  let documentLeadRepo: jest.Mocked<Repository<DocumentLead>>;
  let storageService: jest.Mocked<IStorageService>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;

  beforeEach(async () => {
    publicDocumentsRepository = {
      listar: jest.fn(),
      destaques: jest.fn(),
      recentes: jest.fn(),
      findById: jest.fn(),
    };
    documentLeadRepo = {
      create: jest.fn((input: Partial<DocumentLead>) => input),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DocumentLead>>;
    storageService = { save: jest.fn(), getStream: jest.fn(), delete: jest.fn() };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicDocumentsService,
        { provide: PublicDocumentsRepository, useValue: publicDocumentsRepository },
        { provide: getRepositoryToken(DocumentLead), useValue: documentLeadRepo },
        { provide: STORAGE_SERVICE, useValue: storageService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(PublicDocumentsService);
  });

  describe('listar', () => {
    it('should delegate to the repository and map every returned document to a public DTO', async () => {
      const documents = [makeDocument({ id: 'doc-1' }), makeDocument({ id: 'doc-2' })];
      publicDocumentsRepository.listar.mockResolvedValue({
        data: documents,
        total: 2,
        page: 1,
        limit: 20,
      });

      const result = await service.listar({});

      expect(publicDocumentsRepository.listar).toHaveBeenCalledWith({});
      expect(result.data).toHaveLength(2);
      expect(result.data.map((d) => d.id)).toEqual(['doc-1', 'doc-2']);
      expect(result.total).toBe(2);
    });

    it('should never include arquivoChave or departamentoId in the mapped response', async () => {
      publicDocumentsRepository.listar.mockResolvedValue({
        data: [makeDocument()],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await service.listar({});

      const [dto] = result.data;
      expect(dto).not.toHaveProperty('arquivoChave');
      expect(dto).not.toHaveProperty('departamentoId');
      expect(dto).not.toHaveProperty('confidencialidade');
      expect(dto).not.toHaveProperty('isActive');
      expect(Object.keys(dto as object).sort()).toEqual(
        [
          'arquivoMimeType',
          'arquivoNome',
          'arquivoTamanho',
          'createdAt',
          'descricao',
          'destaque',
          'exigeCadastro',
          'id',
          'nome',
          'serie',
        ].sort(),
      );
    });
  });

  describe('destaques', () => {
    it('should delegate to the repository and map the result to public DTOs', async () => {
      publicDocumentsRepository.destaques.mockResolvedValue([makeDocument({ destaque: true })]);

      const result = await service.destaques();

      expect(publicDocumentsRepository.destaques).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].destaque).toBe(true);
    });
  });

  describe('recentes', () => {
    it('should forward the limit to the repository and map the result to public DTOs', async () => {
      publicDocumentsRepository.recentes.mockResolvedValue([makeDocument()]);

      const result = await service.recentes(3);

      expect(publicDocumentsRepository.recentes).toHaveBeenCalledWith(3);
      expect(result).toHaveLength(1);
    });
  });

  describe('buscarPorId', () => {
    it('should return the mapped public DTO when the document exists and is public', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(makeDocument({ id: 'doc-1' }));

      const result = await service.buscarPorId('doc-1');

      expect(result.id).toBe('doc-1');
    });

    it('should throw NotFoundException when the repository returns null (non-PUBLICO, inactive, or missing)', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(null);

      await expect(service.buscarPorId('doc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarAcesso', () => {
    const meta = { ipCliente: '203.0.113.5', userAgent: 'jest-agent' };

    it('should throw NotFoundException without persisting a lead when the document is not found', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.registrarAcesso(
          'doc-1',
          { email: 'lead@example.com', nome: 'Lead', documento: '111.444.777-35', tipoDocumento: 'CPF' },
          meta,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(documentLeadRepo.create).not.toHaveBeenCalled();
      expect(documentLeadRepo.save).not.toHaveBeenCalled();
    });

    it('should persist a DocumentLead with the stripped (unmasked) CPF digits and return a signed token', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(makeDocument({ id: 'doc-1' }));
      jwtService.signAsync.mockResolvedValue('signed-jwt-token');

      const result = await service.registrarAcesso(
        'doc-1',
        {
          email: 'lead@example.com',
          nome: 'Fulano de Tal',
          documento: '111.444.777-35',
          tipoDocumento: 'CPF',
        },
        meta,
      );

      expect(documentLeadRepo.create).toHaveBeenCalledWith({
        email: 'lead@example.com',
        nome: 'Fulano de Tal',
        documento: '11144477735',
        tipoDocumento: 'CPF',
        documentId: 'doc-1',
        ipCliente: '203.0.113.5',
        userAgent: 'jest-agent',
      });
      expect(documentLeadRepo.save).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'doc-1', scope: 'portal-download' },
        { expiresIn: '10m' },
      );
      expect(result).toEqual({ downloadToken: 'signed-jwt-token' });
    });

    it('should persist a DocumentLead with the stripped (unmasked) CNPJ digits', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(makeDocument({ id: 'doc-1' }));
      jwtService.signAsync.mockResolvedValue('signed-jwt-token');

      await service.registrarAcesso(
        'doc-1',
        {
          email: 'lead@example.com',
          nome: 'Empresa LTDA',
          documento: '11.222.333/0001-81',
          tipoDocumento: 'CNPJ',
        },
        meta,
      );

      expect(documentLeadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ documento: '11222333000181', tipoDocumento: 'CNPJ' }),
      );
    });
  });

  describe('getDownload', () => {
    it('should stream directly without requiring a token when exigeCadastro is false', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: false, arquivoChave: 'drive-key-1' }),
      );
      const stream = {} as NodeJS.ReadableStream;
      storageService.getStream.mockResolvedValue(stream);

      const result = await service.getDownload('doc-1');

      expect(storageService.getStream).toHaveBeenCalledWith('drive-key-1');
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(result.stream).toBe(stream);
    });

    it('should throw NotFoundException when the document is not found (non-PUBLICO, inactive, or missing)', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(null);

      await expect(service.getDownload('doc-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when exigeCadastro is true and no token is provided', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: true }),
      );

      await expect(service.getDownload('doc-1')).rejects.toThrow(ForbiddenException);
      expect(storageService.getStream).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when token verification fails (expired, malformed, or wrong secret)', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: true }),
      );
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.getDownload('doc-1', 'expired-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(storageService.getStream).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException when the token's sub does not match the requested document id", async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: true }),
      );
      // Token válido, mas emitido para outro documento (doc-2) — reuso cross-documento.
      jwtService.verifyAsync.mockResolvedValue({ sub: 'doc-2', scope: 'portal-download' });

      await expect(service.getDownload('doc-1', 'token-for-doc-2')).rejects.toThrow(
        ForbiddenException,
      );
      expect(storageService.getStream).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the token scope is not portal-download', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: true }),
      );
      jwtService.verifyAsync.mockResolvedValue({ sub: 'doc-1', scope: 'other-scope' });

      await expect(service.getDownload('doc-1', 'wrong-scope-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(storageService.getStream).not.toHaveBeenCalled();
    });

    it('should stream the file when a token scoped to this exact document is valid', async () => {
      publicDocumentsRepository.findById.mockResolvedValue(
        makeDocument({ id: 'doc-1', exigeCadastro: true, arquivoChave: 'drive-key-1' }),
      );
      jwtService.verifyAsync.mockResolvedValue({ sub: 'doc-1', scope: 'portal-download' });
      const stream = {} as NodeJS.ReadableStream;
      storageService.getStream.mockResolvedValue(stream);

      const result = await service.getDownload('doc-1', 'valid-token');

      expect(storageService.getStream).toHaveBeenCalledWith('drive-key-1');
      expect(result.stream).toBe(stream);
    });
  });
});
