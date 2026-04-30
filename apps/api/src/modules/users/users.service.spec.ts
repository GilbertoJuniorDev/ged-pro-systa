import { Test } from '@nestjs/testing';
import { UsersService, USER_REPOSITORY } from './users.service';
import type { IUserRepository, CreateUserData } from './interfaces/user-repository.interface';
import type { User } from '@ged/database';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@ged.local',
    passwordHash: 'hashed',
    role: 'VIEWER',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    documents: [],
    refreshTokens: [],
    ...overrides,
  } as User;
}

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      const user = makeUser();
      mockRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('test@ged.local');

      expect(result).toEqual(user);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@ged.local');
    });

    it('should return null when email does not exist', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@ged.local');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when id exists', async () => {
      const user = makeUser();
      mockRepository.findById.mockResolvedValue(user);

      const result = await service.findById('user-uuid-1');

      expect(result).toEqual(user);
      expect(mockRepository.findById).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should return null when id does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const data: CreateUserData = {
        name: 'New User',
        email: 'new@ged.local',
        passwordHash: 'hashed-password',
        role: 'VIEWER',
      };
      const created = makeUser({ ...data });
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });
  });
});
