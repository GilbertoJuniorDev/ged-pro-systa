import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogsRepository } from './error-logs.repository';
import { ErrorLog, ErrorLogSchema } from './schemas/error-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErrorLog.name, schema: ErrorLogSchema },
    ]),
    UserPermissionsModule,
  ],
  controllers: [ErrorLogsController],
  providers: [ErrorLogsRepository, ErrorLogsService],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
