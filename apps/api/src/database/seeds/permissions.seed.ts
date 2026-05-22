import type { DataSource } from 'typeorm';
import { Module as ModuleEntity, Permission } from '@ged/database';

interface PermissionSeed {
  readonly nome: string;
  readonly descricao: string;
}

interface ModuleSeed {
  readonly nome: string;
  readonly slug: string;
  readonly descricao: string;
  readonly icone: string | null;
  readonly ordem: number;
  readonly permissions: ReadonlyArray<PermissionSeed>;
}

const MODULE_SEEDS: ReadonlyArray<ModuleSeed> = [
  {
    nome: 'Logs',
    slug: 'logs',
    descricao: 'Logs de erros do sistema',
    icone: 'AlertTriangle',
    ordem: 100,
    permissions: [
      {
        nome: 'LOGS_VIEW',
        descricao: 'Visualizar logs de erro do sistema',
      },
    ],
  },
  {
    nome: 'Configurações',
    slug: 'settings',
    descricao: 'Configurações do sistema',
    icone: 'Settings',
    ordem: 200,
    permissions: [
      {
        nome: 'SETTINGS_VIEW',
        descricao: 'Visualizar configurações do sistema',
      },
      {
        nome: 'SETTINGS_EDIT',
        descricao: 'Editar configurações do sistema',
      },
    ],
  },
];

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const moduleRepo = dataSource.getRepository(ModuleEntity);
  const permissionRepo = dataSource.getRepository(Permission);

  for (const seed of MODULE_SEEDS) {
    let modulo = await moduleRepo.findOne({ where: { slug: seed.slug } });
    if (!modulo) {
      modulo = await moduleRepo.save(
        moduleRepo.create({
          nome: seed.nome,
          slug: seed.slug,
          descricao: seed.descricao,
          icone: seed.icone,
          ordem: seed.ordem,
          isActive: true,
        }),
      );
      console.log(`[Seed] Módulo criado: ${seed.slug}`);
    }

    for (const perm of seed.permissions) {
      const existing = await permissionRepo.findOne({
        where: { nome: perm.nome },
      });
      if (existing) continue;

      await permissionRepo.save(
        permissionRepo.create({
          nome: perm.nome,
          descricao: perm.descricao,
          moduloId: modulo.id,
        }),
      );
      console.log(`[Seed] Permissão criada: ${perm.nome}`);
    }
  }
}
