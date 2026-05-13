import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  ErrorLog,
  type ErrorLogDocument,
} from './schemas/error-log.schema';
import type { CreateErrorLogData } from './dto/create-error-log.dto';

export interface ErrorLogFilter {
  readonly source?: string;
  readonly level?: string;
  readonly statusCode?: number;
  readonly userId?: string;
  readonly search?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface PaginatedErrorLogs {
  readonly data: ErrorLogDocument[];
  readonly total: number;
}

@Injectable()
export class ErrorLogsRepository {
  constructor(
    @InjectModel(ErrorLog.name)
    private readonly model: Model<ErrorLogDocument>,
  ) {}

  create(data: CreateErrorLogData): Promise<ErrorLogDocument> {
    return this.model.create(data);
  }

  async findAll(filter: ErrorLogFilter): Promise<PaginatedErrorLogs> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const createdAt: { $gte?: Date; $lte?: Date } = {};
    if (filter.source) where.source = filter.source;
    if (filter.level) where.level = filter.level;
    if (typeof filter.statusCode === 'number') {
      where.statusCode = filter.statusCode;
    }
    if (filter.userId) where.userId = filter.userId;
    if (filter.search) {
      const escaped = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      where.message = { $regex: escaped, $options: 'i' };
    }
    if (filter.dateFrom || filter.dateTo) {
      if (filter.dateFrom) createdAt.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) createdAt.$lte = new Date(filter.dateTo);
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.model
        .find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(where).exec(),
    ]);

    return { data, total };
  }
}
