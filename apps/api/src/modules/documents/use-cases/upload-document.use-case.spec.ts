import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Department, Document, DocumentSeries, Dossie, CONFIDENCIALIDADE, ROLE } from '@ged/database';
import { STORAGE_SERVICE, type IStorageService } from '../../storage/interfaces/storage.interface';
import { DOCUMENT_REPOSITORY } from '../interfaces/document-repository.interface';
import type { IDocumentRepository } from '../interfaces/document-repository.interface';
import { UploadDocumentUseCase, type UploadDocumentData } from './upload-document.use-case';
import { ApplyDocumentConfidentialityUseCase } from './apply-document-confidentiality.use-case';
import type { JwtPayload } from '@ged/types';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeDepartment = (overrides: Partial<Department> = {}): Department =>
  ({ id: 'dept-1', nome: 'Financeiro', isActive: true, ...overrides }) as Department;

const makeSerie = (overrides: Partial<DocumentSeries> = {}): DocumentSeries =>
  ({
    id: 'serie-1',
    codigo: 'FIN-01',
    departamentoId: 'dept-1',
    prazoCorrenteMeses: 6,
    prazoIntermediarioMeses: 12,
    ...overrides,
  }) as DocumentSeries;

const makeDossie = (overrides: Partial<Dossie> = {}): Dossie =>
  ({ id: 'dossie-1', departamentoId: 'dept-1', ...overrides }) as Dossie;

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    buffer: Buffer.from('conteudo'),
    originalname: 'contrato.pdf',
    mimetype: 'application/pdf',
    size: 8,
    ...overrides,
  }) as Express.Multer.File;

const makeUploadData = (overrides: Partial<UploadDocumentData> = {}): UploadDocumentData => ({
  nome: 'Contrato de prestação de serviço',
  confidencialidade: CONFIDENCIALIDADE.RESTRITO,
  departamentoId: 'dept-1',
  serieId: 'serie-1',
  actingUser: makeJwtPayload(),
  ...overrides,
});

const makeDocument = (overrides: Partial<Document> = {}): Document =>
  ({ id: 'doc-1', nome: 'Contrato', confidencialidade: CONFIDENCIALIDADE.RESTRITO, ...overrides }) as Document;

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let storageService: jest.Mocked<IStorageService>;
  let departmentRepo: jest.Mocked<Repository<Department>>;
  let documentSeriesRepo: jest.Mocked<Repository<DocumentSeries>>;
  let dossieRepo: jest.Mocked<Repository<Dossie>>;
  let applyConfidentiality: jest.Mocked<Pick<ApplyDocumentConfidentialityUseCase, 'execute'>>;
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    findOneOrFail: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    documentRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    storageService = {
      save: jest.fn(),
      getStream: jest.fn(),
      delete: jest.fn(),
    };

    departmentRepo = { findOne: jest.fn() } as unknown as jest.Mocked<Repository<Department>>;
    documentSeriesRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<DocumentSeries>>;
    dossieRepo = { findOne: jest.fn() } as unknown as jest.Mocked<Repository<Dossie>>;

    manager = {
      create: jest.fn((_entity: unknown, data: unknown) => data),
      save: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => unknown) => cb(manager)),
    };
    applyConfidentiality = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository },
        { provide: STORAGE_SERVICE, useValue: storageService },
        { provide: getRepositoryToken(Department), useValue: departmentRepo },
        { provide: getRepositoryToken(DocumentSeries), useValue: documentSeriesRepo },
        { provide: getRepositoryToken(Dossie), useValue: dossieRepo },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: ApplyDocumentConfidentialityUseCase, useValue: applyConfidentiality },
      ],
    }).compile();

    useCase = module.get(UploadDocumentUseCase);
  });

  describe('happy path', () => {
    beforeEach(() => {
      manager.save.mockResolvedValue({ id: 'doc-1' });
      applyConfidentiality.execute.mockResolvedValue({
        confidencialidade: CONFIDENCIALIDADE.RESTRITO,
      });
      manager.findOneOrFail.mockResolvedValue(makeDocument());
    });

    it('saves the file to storage then creates the document row inside a transaction', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });

      const file = makeFile();
      const result = await useCase.execute(makeUploadData(), file);

      expect(storageService.save).toHaveBeenCalledWith({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.create).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({
          nome: 'Contrato de prestação de serviço',
          descricao: null,
          validade: null,
          confidencialidade: 'RESTRITO',
          departamentoId: 'dept-1',
          serieId: 'serie-1',
          dossieId: null,
          fase: 'CORRENTE',
          arquivoNome: 'contrato.pdf',
          arquivoChave: 'drive-file-id',
          arquivoMimeType: 'application/pdf',
          arquivoTamanho: 8,
        }),
      );
      expect(manager.save).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({ nome: 'Contrato de prestação de serviço' }),
      );
      expect(result).toEqual(makeDocument());
    });

    it('converts validade string to a Date', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });

      await useCase.execute(makeUploadData({ validade: '2030-01-01' }), makeFile());

      expect(manager.create).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({ validade: new Date('2030-01-01') }),
      );
    });

    it('defaults destaque and exigeCadastro to false when not provided', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });

      await useCase.execute(makeUploadData(), makeFile());

      expect(manager.create).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({ destaque: false, exigeCadastro: false }),
      );
    });

    it('passes destaque and exigeCadastro through when explicitly provided', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });

      await useCase.execute(
        makeUploadData({ destaque: true, exigeCadastro: true }),
        makeFile(),
      );

      expect(manager.create).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({ destaque: true, exigeCadastro: true }),
      );
    });

    it('validates the dossiê when provided and belonging to the same department', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      dossieRepo.findOne.mockResolvedValue(makeDossie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });

      await useCase.execute(makeUploadData({ dossieId: 'dossie-1' }), makeFile());

      expect(manager.create).toHaveBeenCalledWith(
        Document,
        expect.objectContaining({ dossieId: 'dossie-1' }),
      );
    });
  });

  describe('FK validation failures (must not touch storage)', () => {
    it('throws BadRequestException when departamento does not exist', async () => {
      departmentRepo.findOne.mockResolvedValue(null);

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(
        new BadRequestException('Departamento não encontrado'),
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when série does not exist', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(null);

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(
        new BadRequestException('Série não encontrada'),
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when série belongs to a different departamento', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie({ departamentoId: 'dept-2' }));

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(
        new BadRequestException('A série deve pertencer ao mesmo departamento do documento'),
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when dossiê does not exist', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      dossieRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute(makeUploadData({ dossieId: 'dossie-1' }), makeFile()),
      ).rejects.toThrow(new BadRequestException('Dossiê não encontrado'));
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when dossiê belongs to a different departamento', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      dossieRepo.findOne.mockResolvedValue(makeDossie({ departamentoId: 'dept-2' }));

      await expect(
        useCase.execute(makeUploadData({ dossieId: 'dossie-1' }), makeFile()),
      ).rejects.toThrow(
        new BadRequestException('O dossiê deve pertencer ao mesmo departamento do documento'),
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });
  });

  describe('compensating delete', () => {
    it('deletes the just-uploaded file and rethrows when the DB write fails', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      const dbError = new Error('DB write failed');
      manager.save.mockRejectedValue(dbError);

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(dbError);

      expect(storageService.delete).toHaveBeenCalledWith('drive-file-id');
    });

    it('deletes the just-uploaded file and rethrows when ApplyDocumentConfidentialityUseCase denies the request', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      manager.save.mockResolvedValue({ id: 'doc-1' });
      const forbidden = new ForbiddenException(
        'Você não tem permissão para gerenciar a confidencialidade deste documento',
      );
      applyConfidentiality.execute.mockRejectedValue(forbidden);

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(forbidden);

      expect(storageService.delete).toHaveBeenCalledWith('drive-file-id');
      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe('confidentiality wiring', () => {
    it('calls ApplyDocumentConfidentialityUseCase with the new document id, forwards grant fields and actingUser, inside the same transaction manager', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      manager.save.mockResolvedValue({ id: 'doc-1' });
      applyConfidentiality.execute.mockResolvedValue({
        confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
      });
      manager.findOneOrFail.mockResolvedValue(
        makeDocument({ confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL }),
      );
      const actingUser = makeJwtPayload({ sub: 'uploader-1' });

      const data = makeUploadData({
        confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
        accessUserIds: ['other-user'],
        actingUser,
      });

      const result = await useCase.execute(data, makeFile());

      expect(applyConfidentiality.execute).toHaveBeenCalledWith(
        {
          documentId: 'doc-1',
          requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
          requestedAccessDepartamentoIds: undefined,
          requestedAccessUserIds: ['other-user'],
          actingUser,
        },
        manager,
      );
      // Resolved value from the use-case is what gets persisted, not necessarily the request.
      expect(manager.update).toHaveBeenCalledWith(Document, 'doc-1', {
        confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
      });
      expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.CONFIDENCIAL);
    });

    it("persists the confidencialidade resolved by the use-case even when it differs from what was requested", async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      manager.save.mockResolvedValue({ id: 'doc-1' });
      // A caller without manage rights requesting nothing beyond the default resolves to
      // RESTRITO regardless of what (if anything) was requested.
      applyConfidentiality.execute.mockResolvedValue({
        confidencialidade: CONFIDENCIALIDADE.RESTRITO,
      });
      const finalDocument = makeDocument({ confidencialidade: CONFIDENCIALIDADE.RESTRITO });
      manager.findOneOrFail.mockResolvedValue(finalDocument);

      const result = await useCase.execute(
        makeUploadData({ confidencialidade: undefined }),
        makeFile(),
      );

      expect(manager.update).toHaveBeenCalledWith(Document, 'doc-1', {
        confidencialidade: CONFIDENCIALIDADE.RESTRITO,
      });
      expect(result).toEqual(finalDocument);
    });
  });
});
