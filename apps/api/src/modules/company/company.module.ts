import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address, Cnae, Company, Email, Phone } from '@ged/database';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CompanyRepository } from './company.repository';
import { CompanyService, COMPANY_REPOSITORY } from './company.service';
import { CompanyController } from './company.controller';

import { CompanyAddressRepository } from './addresses/company-address.repository';
import {
  CompanyAddressesService,
  COMPANY_ADDRESS_REPOSITORY,
} from './addresses/company-addresses.service';
import { CompanyAddressesController } from './addresses/company-addresses.controller';

import { CompanyPhoneRepository } from './phones/company-phone.repository';
import {
  CompanyPhonesService,
  COMPANY_PHONE_REPOSITORY,
} from './phones/company-phones.service';
import { CompanyPhonesController } from './phones/company-phones.controller';

import { CompanyEmailRepository } from './emails/company-email.repository';
import {
  CompanyEmailsService,
  COMPANY_EMAIL_REPOSITORY,
} from './emails/company-emails.service';
import { CompanyEmailsController } from './emails/company-emails.controller';

import { CompanyCnaeRepository } from './cnaes/company-cnae.repository';
import {
  CompanyCnaesService,
  COMPANY_CNAE_REPOSITORY,
} from './cnaes/company-cnaes.service';
import { CompanyCnaesController } from './cnaes/company-cnaes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Address, Phone, Email, Cnae]),
    AuditLogsModule,
  ],
  controllers: [
    CompanyController,
    CompanyAddressesController,
    CompanyPhonesController,
    CompanyEmailsController,
    CompanyCnaesController,
  ],
  providers: [
    { provide: COMPANY_REPOSITORY, useClass: CompanyRepository },
    { provide: COMPANY_ADDRESS_REPOSITORY, useClass: CompanyAddressRepository },
    { provide: COMPANY_PHONE_REPOSITORY, useClass: CompanyPhoneRepository },
    { provide: COMPANY_EMAIL_REPOSITORY, useClass: CompanyEmailRepository },
    { provide: COMPANY_CNAE_REPOSITORY, useClass: CompanyCnaeRepository },
    CompanyService,
    CompanyAddressesService,
    CompanyPhonesService,
    CompanyEmailsService,
    CompanyCnaesService,
    RolesGuard,
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
