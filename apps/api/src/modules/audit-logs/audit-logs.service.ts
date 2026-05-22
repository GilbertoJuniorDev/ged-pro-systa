import { Injectable } from '@nestjs/common';
import type { AuditLog } from '@ged/database';
import { AuditLogsRepository } from './audit-logs.repository';
import type { CreateAuditLogData } from './dto/create-audit-log.dto';
import type { AuditLogFilter, PaginatedAuditLogs } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  log(data: CreateAuditLogData): Promise<AuditLog> {
    return this.auditLogsRepository.create(data);
  }

  findAll(filter: AuditLogFilter): Promise<PaginatedAuditLogs> {
    return this.auditLogsRepository.findAll(filter);
  }

  hasLogsByUser(userId: string): Promise<boolean> {
    return this.auditLogsRepository.hasLogsByUser(userId);
  }
}
