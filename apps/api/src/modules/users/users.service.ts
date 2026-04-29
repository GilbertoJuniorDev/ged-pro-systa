import { Injectable, Inject } from '@nestjs/common';
import type { User } from '@ged/database';
import type {
  IUserRepository,
  CreateUserData,
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

  create(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }
}
