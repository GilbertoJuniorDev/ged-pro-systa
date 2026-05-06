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
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissoesService } from './permissoes.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { UpdatePermissaoDto } from './dto/update-permissao.dto';
import { PermissaoResponseDto } from './dto/permissao-response.dto';

function toResponseDto(p: {
  id: string;
  nome: string;
  descricao: string | null;
  moduloId: string | null;
  modulo: unknown;
  createdAt: Date;
}): PermissaoResponseDto {
  const raw = p.modulo as { id?: string; nome?: string; slug?: string } | null | undefined;
  const modulo =
    raw && raw.id && raw.nome && raw.slug
      ? { id: raw.id, nome: raw.nome, slug: raw.slug }
      : null;
  return new PermissaoResponseDto({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    moduloId: p.moduloId,
    modulo,
    createdAt: p.createdAt,
  });
}

@Controller('permissoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class PermissoesController {
  constructor(
    private readonly permissoesService: PermissoesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  async findAll(): Promise<PermissaoResponseDto[]> {
    const permissoes = await this.permissoesService.findAll();
    return permissoes.map(toResponseDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreatePermissaoDto,
  ): Promise<PermissaoResponseDto> {
    const p = await this.permissoesService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_PERMISSAO',
      entidade: 'Permissao',
      entidadeId: p.id,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return toResponseDto(p);
  }

  @Patch(':id')
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePermissaoDto,
  ): Promise<PermissaoResponseDto> {
    const p = await this.permissoesService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_PERMISSAO',
      entidade: 'Permissao',
      entidadeId: p.id,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return toResponseDto(p);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.permissoesService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_PERMISSAO',
      entidade: 'Permissao',
      entidadeId: id,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
