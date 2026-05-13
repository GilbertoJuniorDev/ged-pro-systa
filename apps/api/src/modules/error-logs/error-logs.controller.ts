import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorLogsService } from './error-logs.service';
import { QueryErrorLogDto } from './dto/query-error-log.dto';
import { CreateClientErrorLogDto } from './dto/create-error-log.dto';
import {
  ErrorLogResponseDto,
  PaginatedErrorLogResponseDto,
} from './dto/error-log-response.dto';
import {
  ERROR_LOG_LEVEL,
  type ErrorLogDocument,
} from './schemas/error-log.schema';

function toResponse(doc: ErrorLogDocument): ErrorLogResponseDto {
  return new ErrorLogResponseDto({
    id: String(doc._id),
    source: doc.source,
    level: doc.level,
    message: doc.message,
    stack: doc.stack ?? null,
    code: doc.code ?? null,
    statusCode: doc.statusCode ?? null,
    method: doc.method ?? null,
    url: doc.url ?? null,
    userAgent: doc.userAgent ?? null,
    ip: doc.ip ?? null,
    userId: doc.userId ?? null,
    userEmail: doc.userEmail ?? null,
    requestId: doc.requestId ?? null,
    context: doc.context ?? null,
    createdAt: doc.createdAt,
  });
}

@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LOGS_VIEW')
  async findAll(
    @Query() query: QueryErrorLogDto,
  ): Promise<PaginatedErrorLogResponseDto> {
    const { data, total } = await this.errorLogsService.findAll({
      source: query.source,
      level: query.level,
      statusCode: query.statusCode,
      userId: query.userId,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedErrorLogResponseDto({
      data: data.map(toResponse),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  /**
   * Endpoint público usado pelo frontend Next.js (via route handler proxy)
   * para reportar erros do client/server. Sem autenticação para garantir
   * que erros pré-login também sejam capturados.
   */
  @Post('client')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async reportClient(
    @Body() body: CreateClientErrorLogDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<void> {
    await this.errorLogsService.log({
      source: body.source,
      level: body.level ?? ERROR_LOG_LEVEL.ERROR,
      message: body.message,
      stack: body.stack,
      url: body.url,
      userAgent: body.userAgent ?? req.headers['user-agent'] ?? undefined,
      requestId: body.requestId,
      statusCode: body.statusCode,
      ip,
      context: body.context,
    });
  }
}
