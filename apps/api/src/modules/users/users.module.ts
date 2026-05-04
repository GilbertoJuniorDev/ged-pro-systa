import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@ged/database';
import { UsersRepository } from './users.repository';
import { UsersService, USER_REPOSITORY } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UsersRepository,
    },
    UsersService,
    RolesGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
