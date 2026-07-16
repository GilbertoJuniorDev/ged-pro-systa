import { ROLE } from '@ged/database';
import type { Role } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { UserDepartmentsService } from '../user-departments/user-departments.service';

// Papéis que enxergam todos os documentos, sem restrição por departamento.
export const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN];

export interface AccessScope {
  readonly userId: string;
  readonly userDepartamentoIds: readonly string[];
}

// Retorna null para papéis privilegiados (sem restrição). Caso contrário, o escopo de
// acesso do usuário (id + departamentos aos quais está vinculado, podendo ser vazia).
export async function resolveAccessScope(
  user: JwtPayload,
  userDepartmentsService: UserDepartmentsService,
): Promise<AccessScope | null> {
  if (PRIVILEGED_ROLES.includes(user.role)) {
    return null;
  }
  const departments = await userDepartmentsService.findByUserId(user.sub);
  return { userId: user.sub, userDepartamentoIds: departments.map((d) => d.departamentoId) };
}

// Fragmento SQL parametrizado (usa os binds nomeados :userDepartamentoIds/:userId do
// TypeORM) que decide se um documento é visível a um usuário não-privilegiado: PUBLICO
// sempre visível; RESTRITO visível ao próprio departamento ou via grant explícito em
// document_access_departments; CONFIDENCIAL só visível via grant em document_access_users.
// `documentAlias` permite reuso com query builders que apelidam a tabela `documents` de
// forma diferente do `'document'` usado por DocumentsRepository.findAll.
export function accessScopeSqlFragment(documentAlias: string = 'document'): string {
  return `(
          ${documentAlias}.confidencialidade = 'PUBLICO'
          OR (
            ${documentAlias}.confidencialidade = 'RESTRITO'
            AND (
              ${documentAlias}.departamento_id = ANY(:userDepartamentoIds)
              OR EXISTS (
                SELECT 1 FROM document_access_departments dad
                WHERE dad.document_id = ${documentAlias}.id
                  AND dad.departamento_id = ANY(:userDepartamentoIds)
              )
            )
          )
          OR (
            ${documentAlias}.confidencialidade = 'CONFIDENCIAL'
            AND EXISTS (
              SELECT 1 FROM document_access_users dau
              WHERE dau.document_id = ${documentAlias}.id AND dau.usuario_id = :userId
            )
          )
        )`;
}
