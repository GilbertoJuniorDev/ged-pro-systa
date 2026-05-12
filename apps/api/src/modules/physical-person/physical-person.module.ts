import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address, PhysicalPerson, Phone } from '@ged/database';
import { PhysicalPersonRepository } from './physical-person.repository';
import { AddressRepository } from './address.repository';
import { PhoneRepository } from './phone.repository';
import {
  PhysicalPersonService,
  PHYSICAL_PERSON_REPOSITORY,
  ADDRESS_REPOSITORY,
  PHONE_REPOSITORY,
} from './physical-person.service';
import { PhysicalPersonController } from './physical-person.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhysicalPerson, Address, Phone])],
  controllers: [PhysicalPersonController],
  providers: [
    { provide: PHYSICAL_PERSON_REPOSITORY, useClass: PhysicalPersonRepository },
    { provide: ADDRESS_REPOSITORY, useClass: AddressRepository },
    { provide: PHONE_REPOSITORY, useClass: PhoneRepository },
    PhysicalPersonService,
  ],
  exports: [PhysicalPersonService],
})
export class PhysicalPersonModule {}
