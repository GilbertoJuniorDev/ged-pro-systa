import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioPermissoesService } from './usuario-permissoes.service';
import { AssignPermissaoDto } from './dto/assign-permissao.dto';
import { UsuarioPermissaoResponseDto } from './dto/usuario-permissao-response.dto';

@Controller('users/:userId/permissoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class UsuarioPermissoesController {
  constructor(
    private readonly usuarioPermissoesService: UsuarioPermissoesService,
  ) {}

  @Get()
  async findAll(
    @Param('userId') userId: string,
  ): Promise<UsuarioPermissaoResponseDto[]> {
    const items = await this.usuarioPermissoesService.findByUsuarioId(userId);
    return items.map(
      (up) =>
        new UsuarioPermissaoResponseDto({
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
  async assign(
    @Param('userId') userId: string,
    @Body() dto: AssignPermissaoDto,
  ): Promise<UsuarioPermissaoResponseDto> {
    const up = await this.usuarioPermissoesService.assign(userId, dto.permissaoId);
    return new UsuarioPermissaoResponseDto({
      id: up.id,
      usuarioId: up.usuarioId,
      permissaoId: up.permissaoId,
      permissaoNome: (up.permissao as { nome: string }).nome ?? '',
      permissaoDescricao: (up.permissao as { descricao: string | null }).descricao ?? null,
      createdAt: up.createdAt,
    });
  }

  @Delete(':permissaoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Param('userId') userId: string,
    @Param('permissaoId') permissaoId: string,
  ): Promise<void> {
    await this.usuarioPermissoesService.revoke(userId, permissaoId);
  }
}
