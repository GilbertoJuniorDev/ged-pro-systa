import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { User } from '@ged/database';
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
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.findAll();
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
    return this.userRepository.remove(id);
  }

  async setActive(id: string, isActive: boolean, currentUserId: string): Promise<User> {
    if (id === currentUserId) {
      throw new BadRequestException('Não é possível alterar o status do próprio usuário');
    }
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.userRepository.setActive(id, isActive);
  }
}
