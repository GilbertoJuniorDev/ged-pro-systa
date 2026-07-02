import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ROLE } from '@ged/database';
import type { Department } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService, DEPARTMENT_REPOSITORY } from './departments.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';

const makeDepartment = (overrides: Partial<Department> = {}): Department =>
  ({
    id: 'dept-1',
    nome: 'Financeiro',
    descricao: null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    usuarioDepartamentos: [],
    ...overrides,
  }) as Department;

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

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let departmentsService: jest.Mocked<DepartmentsService>;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        DepartmentsService,
        { provide: DEPARTMENT_REPOSITORY, useValue: mockRepository },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    controller = module.get(DepartmentsController);
    departmentsService = module.get(DepartmentsService) as jest.Mocked<DepartmentsService>;
  });

  describe('findAll', () => {
    it('should return list of departments as DepartmentResponseDto', async () => {
      const departments = [makeDepartment(), makeDepartment({ id: 'dept-2', nome: 'RH' })];
      jest.spyOn(departmentsService, 'findAll').mockResolvedValue(departments);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'dept-1', nome: 'Financeiro' }),
      );
      expect(departmentsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      jest.spyOn(departmentsService, 'findOne').mockResolvedValue(makeDepartment());

      const result = await controller.findOne('dept-1');

      expect(result.id).toBe('dept-1');
      expect(departmentsService.findOne).toHaveBeenCalledWith('dept-1');
    });

    it('should throw NotFoundException when department does not exist', async () => {
      jest.spyOn(departmentsService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a department and log the action', async () => {
      const created = makeDepartment();
      jest.spyOn(departmentsService, 'create').mockResolvedValue(created);
      const dto: CreateDepartmentDto = { nome: 'Financeiro' };

      const result = await controller.create(makeHttpRequest(), makeJwtPayload(), dto);

      expect(result.id).toBe('dept-1');
      expect(departmentsService.create).toHaveBeenCalledWith(dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_DEPARTAMENTO',
          entidade: 'Department',
          entidadeId: 'dept-1',
        }),
      );
    });

    it('should throw ConflictException when nome already exists', async () => {
      jest.spyOn(departmentsService, 'create').mockRejectedValue(new ConflictException());
      const dto: CreateDepartmentDto = { nome: 'Financeiro' };

      await expect(
        controller.create(makeHttpRequest(), makeJwtPayload(), dto),
      ).rejects.toThrow(ConflictException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a department and log before/after data', async () => {
      const before = makeDepartment();
      const updated = makeDepartment({ nome: 'Financeiro Corp' });
      jest.spyOn(departmentsService, 'findOne').mockResolvedValue(before);
      jest.spyOn(departmentsService, 'update').mockResolvedValue(updated);
      const dto: UpdateDepartmentDto = { nome: 'Financeiro Corp' };

      const result = await controller.update(makeHttpRequest(), makeJwtPayload(), 'dept-1', dto);

      expect(result.nome).toBe('Financeiro Corp');
      expect(departmentsService.update).toHaveBeenCalledWith('dept-1', dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'ATUALIZAR_DEPARTAMENTO',
          entidade: 'Department',
          entidadeId: 'dept-1',
          dadosAnteriores: expect.objectContaining({ nome: 'Financeiro' }),
          dadosNovos: expect.objectContaining({ nome: 'Financeiro Corp' }),
        }),
      );
    });

    it('should throw NotFoundException when department does not exist', async () => {
      jest.spyOn(departmentsService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(makeHttpRequest(), makeJwtPayload(), 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a department and log the action', async () => {
      jest.spyOn(departmentsService, 'findOne').mockResolvedValue(makeDepartment());
      jest.spyOn(departmentsService, 'remove').mockResolvedValue(undefined);

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'dept-1'),
      ).resolves.toBeUndefined();
      expect(departmentsService.remove).toHaveBeenCalledWith('dept-1');
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETAR_DEPARTAMENTO',
          entidade: 'Department',
          entidadeId: 'dept-1',
          dadosNovos: null,
        }),
      );
    });

    it('should throw NotFoundException when department does not exist', async () => {
      jest.spyOn(departmentsService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });
});
