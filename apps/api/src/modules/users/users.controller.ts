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
import { UpdateUserWithDepartmentsUseCase } from './use-cases/update-user-with-departments.use-case';
import { UserDepartmentsService } from '../user-departments/user-departments.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly createUserWithProfileUseCase: CreateUserWithProfileUseCase,
    private readonly updateUserWithDepartmentsUseCase: UpdateUserWithDepartmentsUseCase,
    private readonly userDepartmentsService: UserDepartmentsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Roles(ROLE.ADMIN)
  async findAll(@CurrentUser() currentUser: JwtPayload): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll(currentUser.role);
    const departmentsByUser = await this.userDepartmentsService.findByUserIds(
      users.map((user) => user.id),
    );
    return users.map(
      (user) =>
        new UserResponseDto({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          departamentoIds: (departmentsByUser.get(user.id) ?? []).map(
            (userDepartment) => userDepartment.departamentoId,
          ),
        }),
    );
  }

  @Post()
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: HttpRequest,
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    const user = await this.createUserWithProfileUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      actingUserRole: currentUser.role,
      pessoaFisica: dto.pessoaFisica,
      permissaoIds: dto.permissaoIds,
      departamentoIds: dto.departamentoIds,
    });
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
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
      departamentoIds: dto.departamentoIds ?? [],
    });
  }

  @Get(':id')
  @Roles(ROLE.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const departamentos = await this.userDepartmentsService.findByUserId(id);
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      departamentoIds: departamentos.map((userDepartment) => userDepartment.departamentoId),
    });
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN)
  async update(
    @Req() req: HttpRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    const userBefore = await this.usersService.findById(id);
    const user = await this.updateUserWithDepartmentsUseCase.execute({
      id,
      actingUserRole: currentUser.role,
      data: { name: dto.name, role: dto.role },
      departamentoIds: dto.departamentoIds,
    });
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
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
    const departamentos = await this.userDepartmentsService.findByUserId(id);
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      departamentoIds: departamentos.map((userDepartment) => userDepartment.departamentoId),
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
    const departamentos = await this.userDepartmentsService.findByUserId(id);
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      departamentoIds: departamentos.map((userDepartment) => userDepartment.departamentoId),
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
