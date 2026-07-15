import { type DataSource, type Migration } from 'typeorm';

export async function runMigrationsWithLock(dataSource: DataSource): Promise<Migration[]> {
  const LOCK_KEY = 'ged-pro-systa:migrations';
  const qr = dataSource.createQueryRunner();
  await qr.connect();

  try {
    await qr.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_KEY]);
    return await dataSource.runMigrations({ transaction: 'each' });
  } finally {
    await qr.query('SELECT pg_advisory_unlock(hashtext($1))', [LOCK_KEY]);
    await qr.release();
  }
}
