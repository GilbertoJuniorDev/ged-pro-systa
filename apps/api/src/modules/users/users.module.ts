import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@ged/database';
import { UsersRepository } from './users.repository';
import { UsersService, USER_REPOSITORY } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UsersRepository,
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
