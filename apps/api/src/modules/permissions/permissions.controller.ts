import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsService } from './permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

function toResponseDto(p: {
  id: string;
  nome: string;
  descricao: string | null;
  moduloId: string | null;
  modulo: unknown;
  createdAt: Date;
}): PermissionResponseDto {
  const raw = p.modulo as { id?: string; nome?: string; slug?: string } | null | undefined;
  const modulo =
    raw && raw.id && raw.nome && raw.slug
      ? { id: raw.id, nome: raw.nome, slug: raw.slug }
      : null;
  return new PermissionResponseDto({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    moduloId: p.moduloId,
    modulo,
    createdAt: p.createdAt,
  });
}

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions listed successfully' })
  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionsService.findAll();
    return permissions.map(toResponseDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const p = await this.permissionsService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CREATE_PERMISSION',
      entidade: 'Permission',
      entidadeId: p.id,
      dadosAnteriores: null,
      dadosNovos: { id: p.id, nome: p.nome, descricao: p.descricao, moduloId: p.moduloId },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return toResponseDto(p);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const before = await this.permissionsService.findById(id);
    const p = await this.permissionsService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'UPDATE_PERMISSION',
      entidade: 'Permission',
      entidadeId: p.id,
      dadosAnteriores: { id: before.id, nome: before.nome, descricao: before.descricao, moduloId: before.moduloId },
      dadosNovos: { id: p.id, nome: p.nome, descricao: p.descricao, moduloId: p.moduloId },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return toResponseDto(p);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.permissionsService.findById(id);
    await this.permissionsService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETE_PERMISSION',
      entidade: 'Permission',
      entidadeId: id,
      dadosAnteriores: { id: before.id, nome: before.nome, descricao: before.descricao, moduloId: before.moduloId },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}


