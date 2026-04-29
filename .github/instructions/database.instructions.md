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

## Convenções Obrigatórias

- Colunas: `snake_case` via `@Column({ name: 'snake_case_name' })` — TypeScript usa `camelCase`
- Tabelas: `snake_case` plural via `@Entity('table_name')`
- PKs: sempre `uuid` via `@PrimaryGeneratedColumn('uuid')`
- Datas: sempre `@CreateDateColumn` e `@UpdateDateColumn` com `name: 'created_at'` / `name: 'updated_at'`
- Relacionamentos: `onDelete: 'CASCADE'` em FKs quando a entidade filha não faz sentido sem a pai

## Entidade User

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ name: 'password_hash' }) passwordHash: string;
  @Column({ type: 'enum', enum: Role, default: Role.VIEWER }) role: Role;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Document, (doc) => doc.uploader) documents: Document[];
  @OneToMany(() => RefreshToken, (rt) => rt.user) refreshTokens: RefreshToken[];
}
```

## Entidade RefreshToken

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) token: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'expires_at' }) expiresAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

## Entidade Category

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Document } from './document.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) name: string;
  @Column({ nullable: true }) description?: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => Document, (doc) => doc.category) documents: Document[];
}
```

## Entidade Document

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum DocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ nullable: true }) description?: string;
  @Column({ name: 'file_name' }) fileName: string;
  @Column({ name: 'file_path' }) filePath: string;
  @Column({ name: 'mime_type' }) mimeType: string;
  @Column({ name: 'file_size' }) fileSize: number;
  @Column({ default: 1 }) version: number;
  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.ACTIVE }) status: DocumentStatus;
  @Column({ type: 'text', array: true, default: '{}' }) tags: string[];
  @Column({ name: 'category_id' }) categoryId: string;
  @Column({ name: 'uploaded_by' }) uploadedBy: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @ManyToOne(() => Category, (cat) => cat.documents) @JoinColumn({ name: 'category_id' }) category: Category;
  @ManyToOne(() => User, (user) => user.documents) @JoinColumn({ name: 'uploaded_by' }) uploader: User;
}
```

## Migrations

- Sempre criar migrations reversíveis (método `down` obrigatório)
- Nunca dropar colunas na mesma release que remove o código que as usa
- Rodar via `pnpm db:migrate` — nunca `synchronize: true` em produção
- Testar rollback (`pnpm db:migrate:revert`) antes de abrir PR
