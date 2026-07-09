import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { CONFIDENCIALIDADE, DOCUMENT_FASE, DocumentSeries, Dossie, ROLE } from '@ged/database';
import type { Document, UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { STORAGE_SERVICE, type IStorageService } from '../storage/interfaces/storage.interface';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { DocumentsService } from './documents.service';
import { DOCUMENT_REPOSITORY } from './interfaces/document-repository.interface';
import type { IDocumentRepository } from './interfaces/document-repository.interface';
import { UploadDocumentUseCase } from './use-cases/upload-document.use-case';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeUserDepartment = (departamentoId: string): UserDepartment =>
  ({ departamentoId }) as UserDepartment;

const makeSerie = (overrides: Partial<DocumentSeries> = {}): DocumentSeries =>
  ({
    id: 'serie-1',
    codigo: 'FIN-01',
    departamentoId: 'dept-1',
    prazoCorrenteMeses: 6,
    prazoIntermediarioMeses: 12,
    ...overrides,
  }) as DocumentSeries;

// `validade`, `faseCorrenteDesde` and `faseIntermediarioDesde` are Postgres `date`
// columns: TypeORM/pg returns them as 'YYYY-MM-DD' strings, not Date objects (unlike the
// `timestamp` columns createdAt/updatedAt). Fixtures mirror that real shape so the
// toResponseDto tests exercise what actually flows through in production.
type DocumentOverrides = Partial<
  Omit<Document, 'faseCorrenteDesde' | 'faseIntermediarioDesde' | 'validade'>
> & {
  faseCorrenteDesde?: string;
  faseIntermediarioDesde?: string | null;
  validade?: string | null;
};

const makeDocument = (overrides: DocumentOverrides = {}): Document =>
  ({
    id: 'doc-1',
    nome: 'Contrato',
    descricao: null,
    validade: null,
    confidencialidade: CONFIDENCIALIDADE.INTERNO,
    departamentoId: 'dept-1',
    serieId: 'serie-1',
    dossieId: null,
    fase: DOCUMENT_FASE.CORRENTE,
    faseCorrenteDesde: '2026-01-01',
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
    serie: makeSerie(),
    ...overrides,
  }) as unknown as Document;

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let storageService: jest.Mocked<IStorageService>;
  let uploadDocumentUseCase: jest.Mocked<Pick<UploadDocumentUseCase, 'execute'>>;
  let documentSeriesRepo: jest.Mocked<Repository<DocumentSeries>>;
  let dossieRepo: jest.Mocked<Repository<Dossie>>;
  let userDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'findByUserId'>>;

  beforeEach(async () => {
    documentRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    userDepartmentsService = { findByUserId: jest.fn() };

    storageService = {
      save: jest.fn(),
      getStream: jest.fn(),
      delete: jest.fn(),
    };

    uploadDocumentUseCase = { execute: jest.fn() };

    documentSeriesRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<DocumentSeries>>;
    dossieRepo = { findOne: jest.fn() } as unknown as jest.Mocked<Repository<Dossie>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository },
        { provide: STORAGE_SERVICE, useValue: storageService },
        { provide: UploadDocumentUseCase, useValue: uploadDocumentUseCase },
        { provide: getRepositoryToken(DocumentSeries), useValue: documentSeriesRepo },
        { provide: getRepositoryToken(Dossie), useValue: dossieRepo },
        { provide: UserDepartmentsService, useValue: userDepartmentsService },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  describe('findOne', () => {
    it('returns the document when found', async () => {
      const document = makeDocument();
      documentRepository.findById.mockResolvedValue(document);

      const result = await service.findOne('doc-1');

      expect(result).toEqual(document);
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        new NotFoundException('Documento não encontrado'),
      );
    });

    it('returns the document for an ADMIN regardless of departamento', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument({ departamentoId: 'dept-9' }));

      const result = await service.findOne('doc-1', makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result.departamentoId).toBe('dept-9');
      expect(userDepartmentsService.findByUserId).not.toHaveBeenCalled();
    });

    it('returns the document for a VIEWER of the same departamento', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument({ departamentoId: 'dept-1' }));
      userDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findOne(
        'doc-1',
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result.departamentoId).toBe('dept-1');
      expect(userDepartmentsService.findByUserId).toHaveBeenCalledWith('viewer-1');
    });

    it('throws NotFoundException when a VIEWER accesses a document outside their departamentos', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument({ departamentoId: 'dept-2' }));
      userDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      await expect(
        service.findOne('doc-1', makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER })),
      ).rejects.toThrow(new NotFoundException('Documento não encontrado'));
    });
  });

  describe('findAll', () => {
    const emptyPage = { data: [], total: 0, page: 1, limit: 20 };

    it('passes no departamento restriction for an ADMIN', async () => {
      documentRepository.findAll.mockResolvedValue(emptyPage);

      await service.findAll({}, makeJwtPayload({ role: ROLE.ADMIN }));

      expect(userDepartmentsService.findByUserId).not.toHaveBeenCalled();
      expect(documentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ allowedDepartamentoIds: undefined }),
      );
    });

    it("passes a VIEWER's departamentos as allowedDepartamentoIds", async () => {
      documentRepository.findAll.mockResolvedValue(emptyPage);
      userDepartmentsService.findByUserId.mockResolvedValue([
        makeUserDepartment('dept-1'),
        makeUserDepartment('dept-3'),
      ]);

      await service.findAll({}, makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }));

      expect(documentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ allowedDepartamentoIds: ['dept-1', 'dept-3'] }),
      );
    });

    it('returns an empty page without querying when a VIEWER has no departamentos', async () => {
      userDepartmentsService.findByUserId.mockResolvedValue([]);

      const result = await service.findAll(
        { page: 2, limit: 10 },
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual({ data: [], total: 0, page: 2, limit: 10 });
      expect(documentRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('upload', () => {
    it('delegates to UploadDocumentUseCase', async () => {
      const created = makeDocument();
      uploadDocumentUseCase.execute.mockResolvedValue(created);
      const dto = {
        nome: 'Contrato',
        confidencialidade: CONFIDENCIALIDADE.INTERNO,
        departamentoId: 'dept-1',
        serieId: 'serie-1',
      };
      const file = { originalname: 'x.pdf' } as Express.Multer.File;

      const result = await service.upload(dto, file);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(dto, file);
      expect(result).toEqual(created);
    });

    it('forwards destaque and exigeCadastro to the use case when provided', async () => {
      const created = makeDocument({ destaque: true, exigeCadastro: true });
      uploadDocumentUseCase.execute.mockResolvedValue(created);
      const dto = {
        nome: 'Contrato',
        confidencialidade: CONFIDENCIALIDADE.INTERNO,
        departamentoId: 'dept-1',
        serieId: 'serie-1',
        destaque: true,
        exigeCadastro: true,
      };
      const file = { originalname: 'x.pdf' } as Express.Multer.File;

      const result = await service.upload(dto, file);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(dto, file);
      expect(result.destaque).toBe(true);
      expect(result.exigeCadastro).toBe(true);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the document does not exist', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { nome: 'Novo nome' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the new série does not exist', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument());
      documentSeriesRepo.findOne.mockResolvedValue(null);

      await expect(service.update('doc-1', { serieId: 'serie-2' })).rejects.toThrow(
        new BadRequestException('Série não encontrada'),
      );
      expect(documentRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the new série belongs to a different departamento', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie({ id: 'serie-2', departamentoId: 'dept-2' }));

      await expect(service.update('doc-1', { serieId: 'serie-2' })).rejects.toThrow(
        new BadRequestException('A série deve pertencer ao mesmo departamento do documento'),
      );
      expect(documentRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the new dossiê does not exist', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument());
      dossieRepo.findOne.mockResolvedValue(null);

      await expect(service.update('doc-1', { dossieId: 'dossie-1' })).rejects.toThrow(
        new BadRequestException('Dossiê não encontrado'),
      );
      expect(documentRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the new dossiê belongs to a different departamento', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument());
      dossieRepo.findOne.mockResolvedValue({ id: 'dossie-1', departamentoId: 'dept-2' } as Dossie);

      await expect(service.update('doc-1', { dossieId: 'dossie-1' })).rejects.toThrow(
        new BadRequestException('O dossiê deve pertencer ao mesmo departamento do documento'),
      );
      expect(documentRepository.update).not.toHaveBeenCalled();
    });

    it('updates the document when validation passes', async () => {
      const current = makeDocument();
      const updated = makeDocument({ nome: 'Novo nome' });
      documentRepository.findById.mockResolvedValue(current);
      documentRepository.update.mockResolvedValue(updated);

      const result = await service.update('doc-1', { nome: 'Novo nome' });

      expect(result).toEqual(updated);
      expect(documentSeriesRepo.findOne).not.toHaveBeenCalled();
      expect(dossieRepo.findOne).not.toHaveBeenCalled();
    });

    it('allows clearing the dossiê (setting it to null) without FK validation', async () => {
      const current = makeDocument({ dossieId: 'dossie-1' });
      const updated = makeDocument({ dossieId: null });
      documentRepository.findById.mockResolvedValue(current);
      documentRepository.update.mockResolvedValue(updated);

      const result = await service.update('doc-1', { dossieId: null });

      expect(result).toEqual(updated);
      expect(dossieRepo.findOne).not.toHaveBeenCalled();
    });

    it('passes destaque and exigeCadastro through to the repository when provided', async () => {
      const current = makeDocument();
      const updated = makeDocument({ destaque: true, exigeCadastro: true });
      documentRepository.findById.mockResolvedValue(current);
      documentRepository.update.mockResolvedValue(updated);

      const result = await service.update('doc-1', { destaque: true, exigeCadastro: true });

      expect(documentRepository.update).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({ destaque: true, exigeCadastro: true }),
      );
      expect(result.destaque).toBe(true);
      expect(result.exigeCadastro).toBe(true);
    });
  });

  describe('remove', () => {
    it('deletes the DB row then calls storage delete', async () => {
      const document = makeDocument();
      documentRepository.findById.mockResolvedValue(document);
      documentRepository.delete.mockResolvedValue(undefined);
      storageService.delete.mockResolvedValue(undefined);

      await service.remove('doc-1');

      expect(documentRepository.delete).toHaveBeenCalledWith('doc-1');
      expect(storageService.delete).toHaveBeenCalledWith('drive-file-id');
    });

    it('swallows a storage-delete error without throwing', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument());
      documentRepository.delete.mockResolvedValue(undefined);
      storageService.delete.mockRejectedValue(new Error('Drive is down'));

      await expect(service.remove('doc-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(documentRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('transferir', () => {
    it('moves the document from CORRENTE to INTERMEDIARIO', async () => {
      const document = makeDocument({ fase: DOCUMENT_FASE.CORRENTE });
      const transferred = makeDocument({
        fase: DOCUMENT_FASE.INTERMEDIARIO,
        faseIntermediarioDesde: '2026-07-06',
      });
      documentRepository.findById.mockResolvedValue(document);
      documentRepository.update.mockResolvedValue(transferred);

      const result = await service.transferir('doc-1');

      expect(documentRepository.update).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({ fase: DOCUMENT_FASE.INTERMEDIARIO }),
      );
      expect(result).toEqual(transferred);
    });

    it('throws ConflictException when the document is already INTERMEDIARIO', async () => {
      documentRepository.findById.mockResolvedValue(
        makeDocument({ fase: DOCUMENT_FASE.INTERMEDIARIO }),
      );

      await expect(service.transferir('doc-1')).rejects.toThrow(
        new ConflictException('Documento não está na fase corrente'),
      );
      expect(documentRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getDownload', () => {
    it('returns the document and its file stream for an ADMIN', async () => {
      const document = makeDocument();
      const stream = {} as NodeJS.ReadableStream;
      documentRepository.findById.mockResolvedValue(document);
      storageService.getStream.mockResolvedValue(stream);

      const result = await service.getDownload('doc-1', makeJwtPayload({ role: ROLE.ADMIN }));

      expect(storageService.getStream).toHaveBeenCalledWith('drive-file-id');
      expect(result).toEqual({ document, stream });
    });

    it('returns the stream for a VIEWER of the same departamento', async () => {
      const document = makeDocument({ departamentoId: 'dept-1' });
      const stream = {} as NodeJS.ReadableStream;
      documentRepository.findById.mockResolvedValue(document);
      storageService.getStream.mockResolvedValue(stream);
      userDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.getDownload(
        'doc-1',
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual({ document, stream });
    });

    it('throws NotFoundException and never streams when a VIEWER is outside the departamento', async () => {
      documentRepository.findById.mockResolvedValue(makeDocument({ departamentoId: 'dept-2' }));
      userDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      await expect(
        service.getDownload('doc-1', makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER })),
      ).rejects.toThrow(new NotFoundException('Documento não encontrado'));
      expect(storageService.getStream).not.toHaveBeenCalled();
    });
  });

  describe('toResponseDto', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('marks elegivelTransferencia true once "now" reaches vencimentoCorrente', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
      const document = makeDocument({
        fase: DOCUMENT_FASE.CORRENTE,
        faseCorrenteDesde: '2026-01-01',
        faseIntermediarioDesde: null,
        serie: makeSerie({ prazoCorrenteMeses: 6, prazoIntermediarioMeses: 12 }),
      });

      const dto = service.toResponseDto(document);

      expect(dto.vencimentoCorrente).toBe('2026-07-01');
      expect(dto.vencimentoIntermediario).toBeNull();
      expect(dto.elegivelTransferencia).toBe(true);
    });

    it('marks elegivelTransferencia false while "now" is before vencimentoCorrente', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
      const document = makeDocument({
        fase: DOCUMENT_FASE.CORRENTE,
        faseCorrenteDesde: '2026-01-01',
        faseIntermediarioDesde: null,
        serie: makeSerie({ prazoCorrenteMeses: 6, prazoIntermediarioMeses: 12 }),
      });

      const dto = service.toResponseDto(document);

      expect(dto.vencimentoCorrente).toBe('2026-07-01');
      expect(dto.elegivelTransferencia).toBe(false);
    });

    it('computes vencimentoIntermediario when faseIntermediarioDesde is set, and is never elegivel once transferred', () => {
      const document = makeDocument({
        fase: DOCUMENT_FASE.INTERMEDIARIO,
        faseCorrenteDesde: '2026-01-01',
        faseIntermediarioDesde: '2026-07-01',
        serie: makeSerie({ prazoCorrenteMeses: 6, prazoIntermediarioMeses: 12 }),
      });

      const dto = service.toResponseDto(document);

      expect(dto.vencimentoCorrente).toBe('2026-07-01');
      expect(dto.vencimentoIntermediario).toBe('2027-07-01');
      expect(dto.elegivelTransferencia).toBe(false);
    });

    it('does not throw and normalizes to YYYY-MM-DD when date columns arrive as strings (TypeORM shape)', () => {
      const document = makeDocument({
        validade: '2027-12-31',
        faseCorrenteDesde: '2026-01-01',
        faseIntermediarioDesde: '2026-07-01',
        serie: makeSerie({ prazoCorrenteMeses: 6, prazoIntermediarioMeses: 12 }),
      });

      const dto = service.toResponseDto(document);

      expect(dto.validade).toBe('2027-12-31');
      expect(dto.faseCorrenteDesde).toBe('2026-01-01');
      expect(dto.faseIntermediarioDesde).toBe('2026-07-01');
      expect(dto.vencimentoCorrente).toBe('2026-07-01');
      expect(dto.vencimentoIntermediario).toBe('2027-07-01');
    });

    it('never includes arquivoChave in the response', () => {
      const dto = service.toResponseDto(makeDocument());

      expect(dto).not.toHaveProperty('arquivoChave');
    });

    it('includes destaque and exigeCadastro when set on the document', () => {
      const document = makeDocument({ destaque: true, exigeCadastro: true });

      const dto = service.toResponseDto(document);

      expect(dto.destaque).toBe(true);
      expect(dto.exigeCadastro).toBe(true);
    });

    it('defaults destaque and exigeCadastro to false when not set on the document', () => {
      const dto = service.toResponseDto(makeDocument());

      expect(dto.destaque).toBe(false);
      expect(dto.exigeCadastro).toBe(false);
    });
  });
});
