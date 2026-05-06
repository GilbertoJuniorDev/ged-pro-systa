import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysicalPerson, User } from '@ged/database';
import { UsersRepository } from './users.repository';
import { UsersService, USER_REPOSITORY } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserWithProfileUseCase } from './use-cases/create-user-with-profile.use-case';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, PhysicalPerson]), AuditLogsModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UsersRepository,
    },
    UsersService,
    RolesGuard,
    CreateUserWithProfileUseCase,
  ],
  exports: [UsersService],
})
export class UsersModule {}
