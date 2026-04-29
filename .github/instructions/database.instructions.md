---
description: "Use when creating or modifying TypeORM entities, migrations, or database schemas in packages/@ged/database. Covers entity definitions for User, RefreshToken, Category, Document, column naming conventions, and relationship patterns."
applyTo: "packages/@ged/database/**"
---

# Database — TypeORM Entities (packages/@ged/database/)

## Localização das Entidades

```
packages/@ged/database/src/entities/
├── user.entity.ts
├── refresh-token.entity.ts
├── category.entity.ts
└── document.entity.ts
```

## Convenções de Nomenclatura

- Tabelas: `snake_case` plural no `@Entity()` — o nome da classe em TypeScript é `PascalCase` singular
- Colunas: propriedades em `camelCase` no TypeScript, mas sempre com `name: 'snake_case'` explícito no decorator `@Column()`
- PKs: sempre `uuid` — nunca `int` auto-increment
- FKs: sempre declarar a coluna da FK explicitamente (ex: `categoryId`) além do relacionamento (`category`), para facilitar queries sem join
- Datas de auditoria: toda entidade deve ter `createdAt` e `updatedAt` usando os decorators específicos do TypeORM, com o nome da coluna em `snake_case`

## Boas Práticas para Entidades

- **Enum nativo do banco vs `const object`**: para colunas `enum` no PostgreSQL, use a feature nativa do TypeORM — garante validação no nível do banco. Fora da entidade, exporte um `const object + as const` para o restante da aplicação consumir (nunca o `enum` TypeScript diretamente)
- **Campos nullable**: apenas declare `nullable: true` quando o campo **realmente** for opcional no domínio. Não usar nullable como atalho para campos não implementados ainda
- **Defaults**: preferir defaults na entidade (`default: value`) em vez de apenas no banco via migration, para que o TypeScript conheça o valor padrão sem precisar buscá-lo
- **`select: false`**: use em colunas sensíveis (ex: `passwordHash`) para evitar retorno acidental em queries sem `addSelect` explícito
- **Relacionamentos lazy vs eager**: nunca usar `eager: true` — carregar relacionamentos explicitamente com `relations: []` no Repository para evitar N+1 queries acidentais
- **`cascade`**: evitar `cascade: true` em relacionamentos — prefira operações explícitas. Reserve `onDelete: 'CASCADE'` apenas para entidades sem significado sem a entidade pai (ex: `RefreshToken` sem `User`)

## Boas Práticas para Migrations

- Sempre implementar o método `down()` — migration sem rollback não é migration, é bomba-relógio
- Nunca dropar ou renomear uma coluna na mesma release que remove o código que a usa — deploys são progressivos
- Nunca usar `synchronize: true` fora de ambiente de teste isolado — em dev e prod, sempre migrations explícitas
- Nomear a migration de forma descritiva: `CreateUsersTable`, `AddIsActiveToUsers`, `AddCategoryIdToDocuments`
- Testar o rollback (`pnpm db:migrate:revert`) localmente antes de abrir PR
- Uma migration por mudança lógica — não agrupar alterações não relacionadas na mesma migration

## Relacionamentos — Decisão

| Situação | Decorator correto |
|---|---|
| Um usuário tem muitos documentos | `@OneToMany` no User + `@ManyToOne` no Document |
| Documento pertence a uma categoria | `@ManyToOne` no Document + `@OneToMany` na Category |
| Entidade filha não existe sem a pai | `onDelete: 'CASCADE'` na FK |
| Entidade filha pode existir sem a pai | `onDelete: 'SET NULL'` + coluna nullable |

## O que verificar antes de criar uma entidade

1. A tabela já existe? Verificar `src/entities/` antes de criar uma nova
2. Precisa de soft delete? Considerar `@DeleteDateColumn` no lugar de um campo `status = 'DELETED'`
3. Os campos de auditoria estão presentes? (`createdAt`, `updatedAt` são obrigatórios em toda entidade)
4. As FKs estão declaradas como coluna + relacionamento? (ex: `categoryId` + `category`)
5. A entidade está exportada no `index.ts` do package?
