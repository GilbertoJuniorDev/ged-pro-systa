# packages/@ged/database — Entidades TypeORM + Migrations

Regras gerais: [`/AGENTS.md`](../../../AGENTS.md). Pacote consumido pela API como `@ged/database`.

## Adicionar uma entidade (3 registros obrigatórios)

Esquecer qualquer um quebra o build/runtime:

1. Criar `src/entities/<nome>.entity.ts`.
2. **Exportar** em `src/index.ts` (API pública do pacote).
3. **Adicionar** ao array `entities` em `apps/api/src/database/database.module.ts`.

## Adicionar uma migration (não é glob)

1. Criar `src/migrations/<timestamp>-<Nome>.ts`.
2. **Registrar no array** de `src/migrations/run.ts` (import explícito — não há autoload por glob).
3. Rodar: `pnpm --filter=@ged/database db:migrate` (revert: `db:migrate:revert`).

> `synchronize: false`. Em runtime a API roda migrations compiladas automaticamente; o `run.ts` é para o CLI de dev.

## Convenções de entidade

```ts
@Entity('users')                              // tabela snake_case plural
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'password_hash', select: false })  // coluna snake_case; segredo não-selecionável
  passwordHash: string;

  @Column({ type: 'enum', enum: ROLE, default: ROLE.VIEWER })  // ROLE = const object de @ged/types
  role: Role;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @OneToMany('RefreshToken', 'user')          // relação lazy por string — evita import circular
  refreshTokens: RefreshToken[];
}
```

- Colunas camelCase no TS ↔ snake_case no banco via `@Column({ name })`.
- **Sem `enum` nativo** — usar `const object + as const + type` exportado de `@ged/types` (ex.: `ROLE`/`Role`).
- Colunas sensíveis (`passwordHash`, tokens): `select: false`.
- Relações via referência string (`@OneToMany('Entity', 'campo')`) para evitar imports circulares.

Nota: o `ErrorLog` (Mongo/Mongoose, `@Schema`/`@Prop`, TTL 30 dias) vive na API, não aqui — este pacote é só Postgres/TypeORM.
