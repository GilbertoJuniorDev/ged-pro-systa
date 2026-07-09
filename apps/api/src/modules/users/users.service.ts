import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLE, RefreshToken } from '@ged/database';
import type { User } from '@ged/database';
import type { Role } from '@ged/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from './interfaces/user-repository.interface';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(currentUserRole: Role): Promise<User[]> {
    const users = await this.userRepository.findAll();
    if (currentUserRole !== ROLE.SUPER_ADMIN) {
      return users.filter((user) => user.role !== ROLE.SUPER_ADMIN);
    }
    return users;
  }

  create(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }

  updatePassword(id: string, passwordHash: string): Promise<void> {
    return this.userRepository.updatePassword(id, passwordHash);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.userRepository.update(id, data);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('Não é possível excluir o próprio usuário');
    }
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.role === ROLE.SUPER_ADMIN) {
      throw new BadRequestException('Não é possível remover/desativar o Super Admin');
    }
    const hasActions = await this.auditLogsService.hasLogsByUser(id);
    if (hasActions) {
      throw new BadRequestException(
        'Usuário possui ações registradas no sistema. Use a desativação em vez da exclusão.',
      );
    }
    return this.userRepository.remove(id);
  }

  async setActive(id: string, isActive: boolean, currentUserId: string): Promise<User> {
    if (id === currentUserId) {
      throw new BadRequestException('Não é possível alterar o status do próprio usuário');
    }
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.role === ROLE.SUPER_ADMIN) {
      throw new BadRequestException('Não é possível remover/desativar o Super Admin');
    }
    const updated = await this.userRepository.setActive(id, isActive);
    // Ao desativar, revoga todas as sessões ativas do usuário
    if (!isActive) {
      await this.refreshTokenRepo.delete({ userId: id });
    }
    return updated;
  }
}
