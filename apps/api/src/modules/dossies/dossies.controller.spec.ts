import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ROLE, Department } from '@ged/database';
import type { Dossie } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DossiesController } from './dossies.controller';
import { DossiesService, DOSSIE_REPOSITORY } from './dossies.service';
import type { CreateDossieDto } from './dto/create-dossie.dto';
import type { UpdateDossieDto } from './dto/update-dossie.dto';

const makeDossie = (overrides: Partial<Dossie> = {}): Dossie =>
  ({
    id: 'dossie-1',
    nome: 'Contratos 2026',
    descricao: null,
    isActive: true,
    departamentoId: 'dept-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    departamento: {} as Department,
    ...overrides,
  }) as Dossie;

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

describe('DossiesController', () => {
  let controller: DossiesController;
  let dossiesService: jest.Mocked<DossiesService>;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockDepartmentRepository = {
      findOne: jest.fn(),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DossiesController],
      providers: [
        DossiesService,
        { provide: DOSSIE_REPOSITORY, useValue: mockRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepository },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    controller = module.get(DossiesController);
    dossiesService = module.get(DossiesService) as jest.Mocked<DossiesService>;
  });

  describe('findAll', () => {
    it('should return list of dossiês as DossieResponseDto', async () => {
      const dossies = [makeDossie(), makeDossie({ id: 'dossie-2', nome: 'RH 2026' })];
      jest.spyOn(dossiesService, 'findAll').mockResolvedValue(dossies);

      const result = await controller.findAll({});

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'dossie-1', nome: 'Contratos 2026' }),
      );
      expect(dossiesService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass departamentoId filter through to the service', async () => {
      jest.spyOn(dossiesService, 'findAll').mockResolvedValue([makeDossie()]);

      await controller.findAll({ departamentoId: 'dept-1' });

      expect(dossiesService.findAll).toHaveBeenCalledWith('dept-1');
    });
  });

  describe('findOne', () => {
    it('should return a dossiê by id', async () => {
      jest.spyOn(dossiesService, 'findOne').mockResolvedValue(makeDossie());

      const result = await controller.findOne('dossie-1');

      expect(result.id).toBe('dossie-1');
      expect(dossiesService.findOne).toHaveBeenCalledWith('dossie-1');
    });

    it('should throw NotFoundException when dossiê does not exist', async () => {
      jest.spyOn(dossiesService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a dossiê and log the action', async () => {
      const created = makeDossie();
      jest.spyOn(dossiesService, 'create').mockResolvedValue(created);
      const dto: CreateDossieDto = { nome: 'Contratos 2026', departamentoId: 'dept-1' };

      const result = await controller.create(makeHttpRequest(), makeJwtPayload(), dto);

      expect(result.id).toBe('dossie-1');
      expect(dossiesService.create).toHaveBeenCalledWith(dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_DOSSIE',
          entidade: 'Dossie',
          entidadeId: 'dossie-1',
        }),
      );
    });

    it('should throw BadRequestException when departamento does not exist', async () => {
      jest.spyOn(dossiesService, 'create').mockRejectedValue(new BadRequestException());
      const dto: CreateDossieDto = { nome: 'Contratos 2026', departamentoId: 'non-existent' };

      await expect(
        controller.create(makeHttpRequest(), makeJwtPayload(), dto),
      ).rejects.toThrow(BadRequestException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a dossiê and log before/after data', async () => {
      const before = makeDossie();
      const updated = makeDossie({ nome: 'Contratos 2026 v2' });
      jest.spyOn(dossiesService, 'findOne').mockResolvedValue(before);
      jest.spyOn(dossiesService, 'update').mockResolvedValue(updated);
      const dto: UpdateDossieDto = { nome: 'Contratos 2026 v2' };

      const result = await controller.update(makeHttpRequest(), makeJwtPayload(), 'dossie-1', dto);

      expect(result.nome).toBe('Contratos 2026 v2');
      expect(dossiesService.update).toHaveBeenCalledWith('dossie-1', dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'ATUALIZAR_DOSSIE',
          entidade: 'Dossie',
          entidadeId: 'dossie-1',
          dadosAnteriores: expect.objectContaining({ nome: 'Contratos 2026' }),
          dadosNovos: expect.objectContaining({ nome: 'Contratos 2026 v2' }),
        }),
      );
    });

    it('should throw NotFoundException when dossiê does not exist', async () => {
      jest.spyOn(dossiesService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(makeHttpRequest(), makeJwtPayload(), 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a dossiê and log the action', async () => {
      jest.spyOn(dossiesService, 'findOne').mockResolvedValue(makeDossie());
      jest.spyOn(dossiesService, 'remove').mockResolvedValue(undefined);

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'dossie-1'),
      ).resolves.toBeUndefined();
      expect(dossiesService.remove).toHaveBeenCalledWith('dossie-1');
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETAR_DOSSIE',
          entidade: 'Dossie',
          entidadeId: 'dossie-1',
          dadosNovos: null,
        }),
      );
    });

    it('should throw NotFoundException when dossiê does not exist', async () => {
      jest.spyOn(dossiesService, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });
});
