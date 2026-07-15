import type { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, ROLE } from '@ged/database';

const DEFAULT_ADMIN_EMAIL = 'admin@ged.local';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const logger = new Logger('SeedAdmin');
  const userRepo = dataSource.getRepository(User);

  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) return;

  if (password.length === 0) {
    logger.warn(
      `SEED_ADMIN_PASSWORD não definido — nenhum usuário super-admin foi criado. ` +
        `Defina SEED_ADMIN_PASSWORD (e opcionalmente SEED_ADMIN_EMAIL) para criar o admin inicial.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = userRepo.create({
    name: 'Administrador',
    email,
    passwordHash,
    role: ROLE.SUPER_ADMIN,
    isActive: true,
  });

  await userRepo.save(admin);
  logger.log(`Usuário super-admin criado: ${email}`);
}
