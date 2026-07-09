import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysicalPerson, RefreshToken, User } from '@ged/database';
import { UsersRepository } from './users.repository';
import { UsersService, USER_REPOSITORY } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserWithProfileUseCase } from './use-cases/create-user-with-profile.use-case';
import { UpdateUserWithDepartmentsUseCase } from './use-cases/update-user-with-departments.use-case';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PhysicalPerson, RefreshToken]),
    AuditLogsModule,
    UserDepartmentsModule,
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UsersRepository,
    },
    UsersService,
    RolesGuard,
    CreateUserWithProfileUseCase,
    UpdateUserWithDepartmentsUseCase,
  ],
  exports: [UsersService],
})
export class UsersModule {}
