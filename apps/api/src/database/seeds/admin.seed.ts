import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, ROLE } from '@ged/database';

const ADMIN_EMAIL = 'admin@ged.local';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) return;

  const passwordHash = await bcrypt.hash('Admin@12345', 12);

  const admin = userRepo.create({
    name: 'Administrador',
    email: ADMIN_EMAIL,
    passwordHash,
    role: ROLE.ADMIN,
    isActive: true,
  });

  await userRepo.save(admin);
  console.log(`[Seed] Usuário admin criado: ${ADMIN_EMAIL}`);
}
