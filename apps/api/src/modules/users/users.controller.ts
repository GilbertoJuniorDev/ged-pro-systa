import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

const BCRYPT_ROUNDS = 12;

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? ROLE.VIEWER,
    });

    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  }
}
