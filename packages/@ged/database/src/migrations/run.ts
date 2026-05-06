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
    RenameTableNamesToEnglish1746500000000
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
