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
  UseGuards,
} from '@nestjs/common';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissoesService } from './permissoes.service';
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
  constructor(private readonly permissoesService: PermissoesService) {}

  @Get()
  async findAll(): Promise<PermissaoResponseDto[]> {
    const permissoes = await this.permissoesService.findAll();
    return permissoes.map(toResponseDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePermissaoDto): Promise<PermissaoResponseDto> {
    const p = await this.permissoesService.create(dto);
    return toResponseDto(p);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissaoDto,
  ): Promise<PermissaoResponseDto> {
    const p = await this.permissoesService.update(id, dto);
    return toResponseDto(p);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.permissoesService.remove(id);
  }
}
