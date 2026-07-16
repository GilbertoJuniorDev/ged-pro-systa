import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department, Document, DocumentSeries, User } from '@ged/database';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DASHBOARD_REPOSITORY } from './interfaces/dashboard-repository.interface';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentSeries, Department, User]),
    UserDepartmentsModule,
  ],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardRepository },
    DashboardService,
  ],
})
export class DashboardModule {}
