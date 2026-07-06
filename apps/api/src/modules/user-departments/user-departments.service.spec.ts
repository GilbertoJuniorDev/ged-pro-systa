import { Test, type TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import type { UserDepartment } from '@ged/database';
import { UserDepartmentsService, USER_DEPARTMENT_REPOSITORY } from './user-departments.service';
import type { IUserDepartmentRepository } from './interfaces/user-department-repository.interface';

const mockUd = (overrides: Partial<UserDepartment> = {}): UserDepartment =>
  ({
    id: 'ud-1',
    usuarioId: 'user-1',
    departamentoId: 'dept-1',
    usuario: null as unknown as UserDepartment['usuario'],
    departamento: null as unknown as UserDepartment['departamento'],
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as UserDepartment;

describe('UserDepartmentsService', () => {
  let service: UserDepartmentsService;
  let mockRepository: jest.Mocked<IUserDepartmentRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
      createMany: jest.fn(),
      removeMany: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        UserDepartmentsService,
        { provide: USER_DEPARTMENT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = testModule.get<UserDepartmentsService>(UserDepartmentsService);
  });

  describe('findByUserId', () => {
    it('should return all department links for a user', async () => {
      const items = [mockUd()];
      mockRepository.findByUserId.mockResolvedValue(items);

      const result = await service.findByUserId('user-1');

      expect(result).toEqual(items);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findByUserIds', () => {
    it('should group department links by usuarioId into a Map', async () => {
      const items = [
        mockUd({ id: 'ud-1', usuarioId: 'user-1', departamentoId: 'dept-1' }),
        mockUd({ id: 'ud-2', usuarioId: 'user-1', departamentoId: 'dept-2' }),
        mockUd({ id: 'ud-3', usuarioId: 'user-2', departamentoId: 'dept-1' }),
      ];
      mockRepository.findByUserIds.mockResolvedValue(items);

      const result = await service.findByUserIds(['user-1', 'user-2']);

      expect(result.get('user-1')).toHaveLength(2);
      expect(result.get('user-2')).toHaveLength(1);
      expect(mockRepository.findByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    });

    it('should return an empty Map when no links are found', async () => {
      mockRepository.findByUserIds.mockResolvedValue([]);

      const result = await service.findByUserIds(['user-1']);

      expect(result.size).toBe(0);
    });
  });

  describe('syncForUser (standalone, no manager)', () => {
    it('should add newly present departments and remove no-longer-present ones', async () => {
      mockRepository.findByUserId.mockResolvedValue([
        mockUd({ departamentoId: 'dept-1' }),
        mockUd({ departamentoId: 'dept-2' }),
      ]);

      await service.syncForUser('user-1', ['dept-2', 'dept-3']);

      expect(mockRepository.removeMany).toHaveBeenCalledWith('user-1', ['dept-1']);
      expect(mockRepository.createMany).toHaveBeenCalledWith('user-1', ['dept-3']);
    });

    it('should not call removeMany/createMany when nothing changed', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockUd({ departamentoId: 'dept-1' })]);

      await service.syncForUser('user-1', ['dept-1']);

      expect(mockRepository.removeMany).not.toHaveBeenCalled();
      expect(mockRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('syncForUser (with an EntityManager)', () => {
    function makeMockManager(current: UserDepartment[]): jest.Mocked<Partial<EntityManager>> {
      return {
        find: jest.fn().mockResolvedValue(current),
        create: jest.fn().mockImplementation((_entity, data) => data),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      } as jest.Mocked<Partial<EntityManager>>;
    }

    it('should diff via the manager and skip the injected repository entirely', async () => {
      const manager = makeMockManager([mockUd({ departamentoId: 'dept-1' })]);

      await service.syncForUser('user-1', ['dept-2'], manager as unknown as EntityManager);

      expect(manager.delete).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
      expect(mockRepository.removeMany).not.toHaveBeenCalled();
      expect(mockRepository.createMany).not.toHaveBeenCalled();
    });

    it('should not touch the manager when nothing changed', async () => {
      const manager = makeMockManager([mockUd({ departamentoId: 'dept-1' })]);

      await service.syncForUser('user-1', ['dept-1'], manager as unknown as EntityManager);

      expect(manager.delete).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });
  });
});
