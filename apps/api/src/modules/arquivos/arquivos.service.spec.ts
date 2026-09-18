import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ARQUIVO_STATUS, Department, ROLE } from '@ged/database';
import type { Arquivo, UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { ArquivosService, ARQUIVO_REPOSITORY } from './arquivos.service';
import { CreateArquivoUseCase } from './use-cases/create-arquivo.use-case';
import type { IArquivoRepository } from './interfaces/arquivo-repository.interface';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeUserDepartment = (departamentoId: string): UserDepartment =>
  ({ departamentoId }) as UserDepartment;

const makeArquivo = (overrides: Partial<Arquivo> = {}): Arquivo =>
  ({
    id: 'arquivo-1',
    codigo: '2026-001',
    ano: 2026,
    sequencia: 1,
    nome: 'Contratos 2026',
    descricao: null,
    status: ARQUIVO_STATUS.ABERTO,
    dataEncerramento: null,
    encerradoPorId: null,
    predio: null,
    sala: null,
    estante: null,
    prateleira: null,
    caixa: null,
    departamentoId: 'dept-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    departamento: {} as Department,
    ...overrides,
  }) as Arquivo;

describe('ArquivosService', () => {
  let service: ArquivosService;
  let mockRepository: jest.Mocked<IArquivoRepository>;
  let mockDepartmentRepository: { find: jest.Mock };
  let mockUserDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'findByUserId'>>;
  let mockCreateArquivoUseCase: jest.Mocked<Pick<CreateArquivoUseCase, 'execute'>>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findDepartamentoIds: jest.fn().mockResolvedValue([]),
      findDepartamentoIdsByArquivos: jest.fn().mockResolvedValue(new Map()),
      syncDepartamentos: jest.fn(),
      countDossiesByArquivo: jest.fn().mockResolvedValue(new Map()),
    };

    mockDepartmentRepository = { find: jest.fn() };
    mockUserDepartmentsService = { findByUserId: jest.fn() };
    mockCreateArquivoUseCase = { execute: jest.fn() };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        ArquivosService,
        { provide: ARQUIVO_REPOSITORY, useValue: mockRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepository },
        { provide: UserDepartmentsService, useValue: mockUserDepartmentsService },
        { provide: CreateArquivoUseCase, useValue: mockCreateArquivoUseCase },
      ],
    }).compile();

    service = testModule.get<ArquivosService>(ArquivosService);
  });

  describe('findAll', () => {
    it('should return all arquivos for a privileged user', async () => {
      const paginated = { data: [makeArquivo()], total: 1, page: 1, limit: 20 };
      mockRepository.findAll.mockResolvedValue(paginated);

      const result = await service.findAll({}, makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result).toEqual(paginated);
      expect(mockUserDepartmentsService.findByUserId).not.toHaveBeenCalled();
    });

    it('should return an empty page without querying when a VIEWER has no departamentos', async () => {
      mockUserDepartmentsService.findByUserId.mockResolvedValue([]);

      const result = await service.findAll({}, makeJwtPayload({ role: ROLE.VIEWER }));

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('should scope a VIEWER to their departamentos via allowedDepartamentoIds', async () => {
      const paginated = { data: [makeArquivo()], total: 1, page: 1, limit: 20 };
      mockRepository.findAll.mockResolvedValue(paginated);
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      await service.findAll({}, makeJwtPayload({ role: ROLE.VIEWER }));

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        allowedDepartamentoIds: ['dept-1'],
      });
    });

    it('should return an empty page when a VIEWER filters by a departamento outside their scope', async () => {
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findAll(
        { departamentoId: 'dept-9' },
        makeJwtPayload({ role: ROLE.VIEWER }),
      );

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne / assertCanAccess', () => {
    it('should throw NotFoundException when arquivo not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should allow access when user departamento matches the arquivo owner', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ departamentoId: 'dept-1' }));
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findOne('arquivo-1', makeJwtPayload({ role: ROLE.VIEWER }));

      expect(result.departamentoId).toBe('dept-1');
    });

    it('should allow access when user departamento matches an arquivo_department link', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ departamentoId: 'dept-1' }));
      mockRepository.findDepartamentoIds.mockResolvedValue(['dept-2']);
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-2')]);

      const result = await service.findOne('arquivo-1', makeJwtPayload({ role: ROLE.VIEWER }));

      expect(result.id).toBe('arquivo-1');
    });

    it('should throw NotFoundException when a VIEWER is outside both owner and linked departamentos', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ departamentoId: 'dept-1' }));
      mockRepository.findDepartamentoIds.mockResolvedValue([]);
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-9')]);

      await expect(
        service.findOne('arquivo-1', makeJwtPayload({ role: ROLE.VIEWER })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw ConflictException when arquivo is FECHADO', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.FECHADO }));

      await expect(service.update('arquivo-1', { nome: 'x' })).rejects.toThrow(ConflictException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update scalar fields when arquivo is ABERTO', async () => {
      const updated = makeArquivo({ nome: 'Novo nome' });
      mockRepository.findById.mockResolvedValue(makeArquivo());
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('arquivo-1', { nome: 'Novo nome' });

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('arquivo-1', { nome: 'Novo nome' });
    });

    it('should throw BadRequestException when a linked departamento does not exist', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo());
      mockDepartmentRepository.find.mockResolvedValue([]);

      await expect(
        service.update('arquivo-1', { departamentoIds: ['dept-9'] }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.syncDepartamentos).not.toHaveBeenCalled();
    });

    it('should sync departamentos excluding the owner departamento', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ departamentoId: 'dept-1' }));
      mockDepartmentRepository.find.mockResolvedValue([{ id: 'dept-2' }]);
      mockRepository.update.mockResolvedValue(makeArquivo());

      await service.update('arquivo-1', { departamentoIds: ['dept-1', 'dept-2'] });

      expect(mockRepository.syncDepartamentos).toHaveBeenCalledWith('arquivo-1', ['dept-2']);
    });
  });

  describe('encerrar / reabrir', () => {
    it('should encerrar an ABERTO arquivo with data and responsible user', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo());
      const encerrado = makeArquivo({ status: ARQUIVO_STATUS.FECHADO });
      mockRepository.update.mockResolvedValue(encerrado);

      const result = await service.encerrar('arquivo-1', makeJwtPayload({ sub: 'admin-1' }));

      expect(result.status).toBe(ARQUIVO_STATUS.FECHADO);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'arquivo-1',
        expect.objectContaining({ status: ARQUIVO_STATUS.FECHADO, encerradoPorId: 'admin-1' }),
      );
    });

    it('should throw ConflictException when encerrando an already FECHADO arquivo', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.FECHADO }));

      await expect(service.encerrar('arquivo-1', makeJwtPayload())).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reabrir a FECHADO arquivo clearing encerramento data', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.FECHADO }));
      const reaberto = makeArquivo({ status: ARQUIVO_STATUS.ABERTO });
      mockRepository.update.mockResolvedValue(reaberto);

      const result = await service.reabrir('arquivo-1');

      expect(result.status).toBe(ARQUIVO_STATUS.ABERTO);
      expect(mockRepository.update).toHaveBeenCalledWith('arquivo-1', {
        status: ARQUIVO_STATUS.ABERTO,
        dataEncerramento: null,
        encerradoPorId: null,
      });
    });

    it('should throw ConflictException when reabrindo an already ABERTO arquivo', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.ABERTO }));

      await expect(service.reabrir('arquivo-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an arquivo when it exists', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo());
      mockRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove('arquivo-1')).resolves.toBeUndefined();
    });

    it('should throw ConflictException when removal violates a foreign key', async () => {
      mockRepository.findById.mockResolvedValue(makeArquivo());
      mockRepository.delete.mockRejectedValue({ code: '23503' });

      await expect(service.remove('arquivo-1')).rejects.toThrow(ConflictException);
    });
  });
});
