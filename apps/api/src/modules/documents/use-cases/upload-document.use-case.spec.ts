import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Department, DocumentSeries, Dossie, CONFIDENCIALIDADE } from '@ged/database';
import type { Document } from '@ged/database';
import { STORAGE_SERVICE, type IStorageService } from '../../storage/interfaces/storage.interface';
import { DOCUMENT_REPOSITORY } from '../interfaces/document-repository.interface';
import type { IDocumentRepository } from '../interfaces/document-repository.interface';
import { UploadDocumentUseCase, type UploadDocumentData } from './upload-document.use-case';

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
  ...overrides,
});

const makeDocument = (overrides: Partial<Document> = {}): Document =>
  ({ id: 'doc-1', nome: 'Contrato', ...overrides }) as Document;

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let storageService: jest.Mocked<IStorageService>;
  let departmentRepo: jest.Mocked<Repository<Department>>;
  let documentSeriesRepo: jest.Mocked<Repository<DocumentSeries>>;
  let dossieRepo: jest.Mocked<Repository<Dossie>>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository },
        { provide: STORAGE_SERVICE, useValue: storageService },
        { provide: getRepositoryToken(Department), useValue: departmentRepo },
        { provide: getRepositoryToken(DocumentSeries), useValue: documentSeriesRepo },
        { provide: getRepositoryToken(Dossie), useValue: dossieRepo },
      ],
    }).compile();

    useCase = module.get(UploadDocumentUseCase);
  });

  describe('happy path', () => {
    it('saves the file to storage then creates the document row', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      const created = makeDocument();
      documentRepository.create.mockResolvedValue(created);

      const file = makeFile();
      const result = await useCase.execute(makeUploadData(), file);

      expect(storageService.save).toHaveBeenCalledWith({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      expect(documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Contrato de prestação de serviço',
          descricao: null,
          validade: null,
          confidencialidade: CONFIDENCIALIDADE.RESTRITO,
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
      expect(result).toEqual(created);
    });

    it('converts validade string to a Date', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      documentRepository.create.mockResolvedValue(makeDocument());

      await useCase.execute(makeUploadData({ validade: '2030-01-01' }), makeFile());

      expect(documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ validade: new Date('2030-01-01') }),
      );
    });

    it('defaults destaque and exigeCadastro to false when not provided', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      documentRepository.create.mockResolvedValue(makeDocument());

      await useCase.execute(makeUploadData(), makeFile());

      expect(documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ destaque: false, exigeCadastro: false }),
      );
    });

    it('passes destaque and exigeCadastro through when explicitly provided', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      documentRepository.create.mockResolvedValue(makeDocument());

      await useCase.execute(
        makeUploadData({ destaque: true, exigeCadastro: true }),
        makeFile(),
      );

      expect(documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ destaque: true, exigeCadastro: true }),
      );
    });

    it('validates the dossiê when provided and belonging to the same department', async () => {
      departmentRepo.findOne.mockResolvedValue(makeDepartment());
      documentSeriesRepo.findOne.mockResolvedValue(makeSerie());
      dossieRepo.findOne.mockResolvedValue(makeDossie());
      storageService.save.mockResolvedValue({ chave: 'drive-file-id', tamanho: 8 });
      documentRepository.create.mockResolvedValue(makeDocument());

      await useCase.execute(makeUploadData({ dossieId: 'dossie-1' }), makeFile());

      expect(documentRepository.create).toHaveBeenCalledWith(
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
      documentRepository.create.mockRejectedValue(dbError);

      await expect(useCase.execute(makeUploadData(), makeFile())).rejects.toThrow(dbError);

      expect(storageService.delete).toHaveBeenCalledWith('drive-file-id');
    });
  });
});
