import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department, UserDepartment } from '@ged/database';
import { UserDepartmentsRepository } from './user-departments.repository';
import { UserDepartmentsService, USER_DEPARTMENT_REPOSITORY } from './user-departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDepartment, Department])],
  providers: [
    { provide: USER_DEPARTMENT_REPOSITORY, useClass: UserDepartmentsRepository },
    UserDepartmentsService,
  ],
  exports: [UserDepartmentsService],
})
export class UserDepartmentsModule {}
