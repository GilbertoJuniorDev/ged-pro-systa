import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleUserStatusDto } from './dto/toggle-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserWithProfileUseCase } from './use-cases/create-user-with-profile.use-case';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly createUserWithProfileUseCase: CreateUserWithProfileUseCase,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Roles(ROLE.ADMIN)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(
      (user) =>
        new UserResponseDto({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        }),
    );
  }

  @Post()
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: HttpRequest, @Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserWithProfileUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      pessoaFisica: dto.pessoaFisica,
      permissaoIds: dto.permissaoIds,
    });
    void this.auditLogsService.log({
      usuarioId: (req.user as { sub: string } | undefined)?.sub ?? null,
      acao: 'CRIAR_USUARIO',
      entidade: 'User',
      entidadeId: user.id,
      dadosAnteriores: null,
      dadosNovos: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
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

  @Get(':id')
  @Roles(ROLE.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN)
  async update(
    @Req() req: HttpRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userBefore = await this.usersService.findById(id);
    const user = await this.usersService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: (req.user as { sub: string } | undefined)?.sub ?? null,
      acao: 'ATUALIZAR_USUARIO',
      entidade: 'User',
      entidadeId: user.id,
      dadosAnteriores: userBefore
        ? { id: userBefore.id, name: userBefore.name, email: userBefore.email, role: userBefore.role, isActive: userBefore.isActive }
        : null,
      dadosNovos: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
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

  @Patch(':id/status')
  @Roles(ROLE.ADMIN)
  async setActive(
    @Param('id') id: string,
    @Body() dto: ToggleUserStatusDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.setActive(id, dto.isActive, currentUser.sub);
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: HttpRequest,
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<void> {
    const userBefore = await this.usersService.findById(id);
    await this.usersService.remove(id, currentUser.sub);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_USUARIO',
      entidade: 'User',
      entidadeId: id,
      dadosAnteriores: userBefore
        ? { id: userBefore.id, name: userBefore.name, email: userBefore.email, role: userBefore.role, isActive: userBefore.isActive }
        : null,
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
