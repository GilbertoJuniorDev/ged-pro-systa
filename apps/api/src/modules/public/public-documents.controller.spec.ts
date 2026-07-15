import { Test, type TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import type { Document } from '@ged/database';
import type { PublicDocumentDto } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { PublicDocumentsController } from './public-documents.controller';
import { PublicDocumentsService } from './public-documents.service';

const makePublicDocumentDto = (overrides: Partial<PublicDocumentDto> = {}): PublicDocumentDto => ({
  id: 'doc-1',
  nome: 'Edital de licitação',
  descricao: null,
  arquivoNome: 'edital.pdf',
  arquivoMimeType: 'application/pdf',
  arquivoTamanho: 2048,
  serie: { id: 'serie-1', codigo: 'FIN-01', nome: 'Contratos financeiros' },
  destaque: false,
  exigeCadastro: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeHttpRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  ip: '203.0.113.5',
  headers: { 'user-agent': 'jest-agent' },
  ...overrides,
});

const makeResponse = (): jest.Mocked<Pick<Response, 'set'>> => ({ set: jest.fn() });

describe('PublicDocumentsController', () => {
  let controller: PublicDocumentsController;
  let publicDocumentsService: jest.Mocked<
    Pick<
      PublicDocumentsService,
      | 'listar'
      | 'destaques'
      | 'recentes'
      | 'series'
      | 'buscarPorId'
      | 'registrarAcesso'
      | 'getDownload'
    >
  >;

  beforeEach(async () => {
    publicDocumentsService = {
      listar: jest.fn(),
      destaques: jest.fn(),
      recentes: jest.fn(),
      series: jest.fn(),
      buscarPorId: jest.fn(),
      registrarAcesso: jest.fn(),
      getDownload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicDocumentsController],
      providers: [{ provide: PublicDocumentsService, useValue: publicDocumentsService }],
    }).compile();

    controller = module.get(PublicDocumentsController);
  });

  describe('listar', () => {
    it('should delegate to the service with the query params', async () => {
      const paginated = { data: [makePublicDocumentDto()], total: 1, page: 1, limit: 20 };
      publicDocumentsService.listar.mockResolvedValue(paginated);

      const result = await controller.listar({ search: 'edital' });

      expect(publicDocumentsService.listar).toHaveBeenCalledWith({ search: 'edital' });
      expect(result).toBe(paginated);
    });
  });

  describe('destaques', () => {
    it('should delegate to the service', async () => {
      const documents = [makePublicDocumentDto({ destaque: true })];
      publicDocumentsService.destaques.mockResolvedValue(documents);

      const result = await controller.destaques();

      expect(publicDocumentsService.destaques).toHaveBeenCalled();
      expect(result).toBe(documents);
    });
  });

  describe('recentes', () => {
    it('should forward the limit query param to the service', async () => {
      const documents = [makePublicDocumentDto()];
      publicDocumentsService.recentes.mockResolvedValue(documents);

      const result = await controller.recentes({ limit: 3 });

      expect(publicDocumentsService.recentes).toHaveBeenCalledWith(3);
      expect(result).toBe(documents);
    });

    it('should pass undefined to the service when limit is omitted', async () => {
      publicDocumentsService.recentes.mockResolvedValue([]);

      await controller.recentes({});

      expect(publicDocumentsService.recentes).toHaveBeenCalledWith(undefined);
    });
  });

  describe('series', () => {
    it('should delegate to the service', async () => {
      const series = [{ id: 'serie-1', codigo: 'FIN-01', nome: 'Contratos financeiros' }];
      publicDocumentsService.series.mockResolvedValue(series);

      const result = await controller.series();

      expect(publicDocumentsService.series).toHaveBeenCalled();
      expect(result).toBe(series);
    });
  });

  describe('buscarPorId', () => {
    it('should delegate to the service with the requested id', async () => {
      const dto = makePublicDocumentDto();
      publicDocumentsService.buscarPorId.mockResolvedValue(dto);

      const result = await controller.buscarPorId('doc-1');

      expect(publicDocumentsService.buscarPorId).toHaveBeenCalledWith('doc-1');
      expect(result).toBe(dto);
    });
  });

  describe('registrarAcesso', () => {
    it('should extract ipCliente and userAgent from the request and delegate to the service', async () => {
      publicDocumentsService.registrarAcesso.mockResolvedValue({ downloadToken: 'token-123' });
      const dto = {
        email: 'lead@example.com',
        nome: 'Fulano de Tal',
        documento: '11144477735',
        tipoDocumento: 'CPF' as const,
      };

      const result = await controller.registrarAcesso('doc-1', dto, makeHttpRequest());

      expect(publicDocumentsService.registrarAcesso).toHaveBeenCalledWith('doc-1', dto, {
        ipCliente: '203.0.113.5',
        userAgent: 'jest-agent',
      });
      expect(result).toEqual({ downloadToken: 'token-123' });
    });

    it('should default ipCliente and userAgent to null when absent from the request', async () => {
      publicDocumentsService.registrarAcesso.mockResolvedValue({ downloadToken: 'token-123' });
      const dto = {
        email: 'lead@example.com',
        nome: 'Fulano de Tal',
        documento: '11144477735',
        tipoDocumento: 'CPF' as const,
      };

      await controller.registrarAcesso(
        'doc-1',
        dto,
        makeHttpRequest({ ip: undefined, headers: {} }),
      );

      expect(publicDocumentsService.registrarAcesso).toHaveBeenCalledWith('doc-1', dto, {
        ipCliente: null,
        userAgent: null,
      });
    });
  });

  describe('download', () => {
    it('should set Content-Type/Content-Disposition headers and return a StreamableFile', async () => {
      const document = {
        arquivoMimeType: 'application/pdf',
        arquivoNome: 'edital.pdf',
      } as Document;
      const stream = {
        // Minimal Readable-shaped stub — StreamableFile only needs it to be stream-like.
        pipe: jest.fn(),
      } as unknown as NodeJS.ReadableStream;
      publicDocumentsService.getDownload.mockResolvedValue({ document, stream });
      const res = makeResponse();

      const result = await controller.download('doc-1', 'valid-token', res as unknown as Response);

      expect(publicDocumentsService.getDownload).toHaveBeenCalledWith('doc-1', 'valid-token');
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="edital.pdf"',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should pass undefined as the token when the query param is absent', async () => {
      const document = { arquivoMimeType: 'application/pdf', arquivoNome: 'edital.pdf' } as Document;
      const stream = { pipe: jest.fn() } as unknown as NodeJS.ReadableStream;
      publicDocumentsService.getDownload.mockResolvedValue({ document, stream });
      const res = makeResponse();

      await controller.download('doc-1', undefined, res as unknown as Response);

      expect(publicDocumentsService.getDownload).toHaveBeenCalledWith('doc-1', undefined);
    });
  });
});
