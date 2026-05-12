import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import {
  AuditLogResponseDto,
  PaginatedAuditLogResponseDto,
} from './dto/audit-log-response.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query() query: QueryAuditLogDto,
  ): Promise<PaginatedAuditLogResponseDto> {
    const { data, total } = await this.auditLogsService.findAll({
      usuarioId: query.usuarioId,
      acao: query.acao,
      entidade: query.entidade,
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedAuditLogResponseDto({
      data: data.map(
        (log) =>
          new AuditLogResponseDto({
            id: log.id,
            usuarioId: log.usuarioId,
            acao: log.acao,
            entidade: log.entidade,
            entidadeId: log.entidadeId,
            ipCliente: log.ipCliente,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
          }),
      ),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
