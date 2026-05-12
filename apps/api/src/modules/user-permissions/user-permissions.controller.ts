import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { UserPermissionsService } from './user-permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UserPermissionResponseDto } from './dto/user-permission-response.dto';

@ApiTags('user-permissions')
@ApiBearerAuth()
@Controller('users/:userId/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions of a user' })
  @ApiResponse({ status: 200, description: 'Permissions listed successfully' })
  async findAll(
    @Param('userId') userId: string,
  ): Promise<UserPermissionResponseDto[]> {
    const items = await this.userPermissionsService.findByUserId(userId);
    return items.map(
      (up) =>
        new UserPermissionResponseDto({
          id: up.id,
          usuarioId: up.usuarioId,
          permissaoId: up.permissaoId,
          permissaoNome: (up.permissao as { nome: string }).nome,
          permissaoDescricao: (up.permissao as { descricao: string | null }).descricao,
          createdAt: up.createdAt,
        }),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a permission to a user' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  async assign(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: AssignPermissionDto,
  ): Promise<UserPermissionResponseDto> {
    const up = await this.userPermissionsService.assign(userId, dto.permissaoId);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ASSIGN_PERMISSION',
      entidade: 'UserPermission',
      entidadeId: up.id,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new UserPermissionResponseDto({
      id: up.id,
      usuarioId: up.usuarioId,
      permissaoId: up.permissaoId,
      permissaoNome: (up.permissao as { nome: string }).nome ?? '',
      permissaoDescricao: (up.permissao as { descricao: string | null }).descricao ?? null,
      createdAt: up.createdAt,
    });
  }

  @Delete(':permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a permission from a user' })
  @ApiResponse({ status: 204, description: 'Permission revoked successfully' })
  async revoke(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    await this.userPermissionsService.revoke(userId, permissionId);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'REVOKE_PERMISSION',
      entidade: 'UserPermission',
      entidadeId: permissionId,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}

