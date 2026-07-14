import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateUsersTable1745798400000 } from './1745798400000-CreateUsersTable';
import { CreateRefreshTokensTable1745798401000 } from './1745798401000-CreateRefreshTokensTable';
import { CreatePasswordResetTokensTable1746057600000 } from './1746057600000-CreatePasswordResetTokensTable';
import { CreatePessoaFisicasTable1746403200000 } from './1746403200000-CreatePessoaFisicasTable';
import { CreateEnderecosTable1746403200001 } from './1746403200001-CreateEnderecosTable';
import { CreateTelefonesTable1746403200002 } from './1746403200002-CreateTelefonesTable';
import { CreatePermissoesTable1746403200003 } from './1746403200003-CreatePermissoesTable';
import { CreateUsuarioPermissoesTable1746403200004 } from './1746403200004-CreateUsuarioPermissoesTable';
import { CreateAuditLogsTable1746403200005 } from './1746403200005-CreateAuditLogsTable';
import { CreateModulosTable1746403200006 } from './1746403200006-CreateModulosTable';
import { AddModuloIdToPermissoes1746403200007 } from './1746403200007-AddModuloIdToPermissoes';
import { RenameTableNamesToEnglish1746500000000 } from './1746500000000-RenameTableNamesToEnglish';
import { CreateCompanyAndSubscription1746600000000 } from './1746600000000-CreateCompanyAndSubscription';
import { AddCompanyRelationsAndCnae1746700000000 } from './1746700000000-AddCompanyRelationsAndCnae';
import { CreateSubscriptionPaymentsTable1747000000000 } from './1747000000000-CreateSubscriptionPaymentsTable';
import { CreateSystemSettingsTable1747200000000 } from './1747200000000-CreateSystemSettingsTable';
import { AddDiffColumnsToAuditLogs1748200000000 } from './1748200000000-AddDiffColumnsToAuditLogs';
import { CreateDepartmentsTable1782950400000 } from './1782950400000-CreateDepartmentsTable';
import { CreateUserDepartmentsTable1782950400001 } from './1782950400001-CreateUserDepartmentsTable';
import { AddSuperAdminToUsersRoleEnum1782950400002 } from './1782950400002-AddSuperAdminToUsersRoleEnum';
import { UpgradeSeedAdminToSuperAdmin1782950400003 } from './1782950400003-UpgradeSeedAdminToSuperAdmin';
import { CreateDocumentSeriesTable1782950400004 } from './1782950400004-CreateDocumentSeriesTable';
import { CreateDossiesTable1782950400005 } from './1782950400005-CreateDossiesTable';
import { CreateDocumentsTable1782950400006 } from './1782950400006-CreateDocumentsTable';
import { AddPortalFieldsToDocuments1782950400007 } from './1782950400007-AddPortalFieldsToDocuments';
import { CreateDocumentLeadsTable1782950400008 } from './1782950400008-CreateDocumentLeadsTable';
import { RemoveInternoConfidencialidade1782950400009 } from './1782950400009-RemoveInternoConfidencialidade';
import { CreateDocumentAccessGrantsTable1782950400010 } from './1782950400010-CreateDocumentAccessGrantsTable';
import { RemoveManagerFromUsersRoleEnum1782950400011 } from './1782950400011-RemoveManagerFromUsersRoleEnum';
const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
  migrations: [
    CreateUsersTable1745798400000,
    CreateRefreshTokensTable1745798401000,
    CreatePasswordResetTokensTable1746057600000,
    CreatePessoaFisicasTable1746403200000,
    CreateEnderecosTable1746403200001,
    CreateTelefonesTable1746403200002,
    CreatePermissoesTable1746403200003,
    CreateUsuarioPermissoesTable1746403200004,
    CreateAuditLogsTable1746403200005,
    CreateModulosTable1746403200006,
    AddModuloIdToPermissoes1746403200007,
    RenameTableNamesToEnglish1746500000000,
    CreateCompanyAndSubscription1746600000000,
    AddCompanyRelationsAndCnae1746700000000,
    CreateSubscriptionPaymentsTable1747000000000,
    CreateSystemSettingsTable1747200000000,
    AddDiffColumnsToAuditLogs1748200000000,
    CreateDepartmentsTable1782950400000,
    CreateUserDepartmentsTable1782950400001,
    AddSuperAdminToUsersRoleEnum1782950400002,
    UpgradeSeedAdminToSuperAdmin1782950400003,
    CreateDocumentSeriesTable1782950400004,
    CreateDossiesTable1782950400005,
    CreateDocumentsTable1782950400006,
    AddPortalFieldsToDocuments1782950400007,
    CreateDocumentLeadsTable1782950400008,
    RemoveInternoConfidencialidade1782950400009,
    CreateDocumentAccessGrantsTable1782950400010,
    RemoveManagerFromUsersRoleEnum1782950400011,
  ],
  migrationsTableName: 'migrations',
});

async function runMigrations(): Promise<void> {
  console.log('Connecting to database...');
  await dataSource.initialize();

  console.log('Running pending migrations...');
  const ran = await dataSource.runMigrations({ transaction: 'each' });

  if (ran.length === 0) {
    console.log('No pending migrations.');
  } else {
    for (const migration of ran) {
      console.log(`  ✓ ${migration.name}`);
    }
  }

  await dataSource.destroy();
  console.log('Done.');
}

runMigrations().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
