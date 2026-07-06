# GED Pro — Arquitetura do Projeto

> ⚠️ **Fonte canônica para agentes: [`AGENTS.md`](../AGENTS.md).** Este documento é a arquitetura-alvo e contém pontos **desatualizados/aspiracionais** (Next 16.2 → real 15.3; `enum` nativo → `const object`; CQRS/storage adapters/`documents` ainda não implementados). Em conflito, valem `AGENTS.md` e o código.

> Sistema de Gerenciamento Eletrônico de Documentos (GED)
> Monorepo · pnpm · Turborepo · Docker · Next.js 16.2 · NestJS 11 · React 19

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack de Tecnologia](#2-stack-de-tecnologia)
3. [Estrutura do Monorepo](#3-estrutura-do-monorepo)
4. [Arquitetura do Backend — NestJS](#4-arquitetura-do-backend--nestjs)
5. [Arquitetura do Frontend — Next.js](#5-arquitetura-do-frontend--nextjs)
6. [Banco de Dados e Entidades TypeORM](#6-banco-de-dados-e-entidades-typeorm)
7. [Infraestrutura e Containers Docker](#7-infraestrutura-e-containers-docker)
8. [Configuração do Monorepo](#8-configuração-do-monorepo)
9. [Design Patterns Aplicados](#9-design-patterns-aplicados)
10. [Princípios de Engenharia de Software](#10-princípios-de-engenharia-de-software)
11. [Estratégia de Testes](#11-estratégia-de-testes)
12. [Convenções de Código](#12-convenções-de-código)
13. [Variáveis de Ambiente](#13-variáveis-de-ambiente)
14. [Scripts e Pipeline Turborepo](#14-scripts-e-pipeline-turborepo)
15. [Fluxo de Desenvolvimento (Git Flow)](#15-fluxo-de-desenvolvimento-git-flow)

---

## 1. Visão Geral

O **GED Pro** é uma aplicação corporativa para controle, organização, armazenamento e acesso a documentos digitais. Oferece:

- Autenticação e controle de acesso baseado em papéis (RBAC)
- Upload, versionamento e download de documentos
- Categorização e pesquisa avançada de documentos
- Painel administrativo para gestão de usuários e permissões
- Suporte a temas claro/escuro (light/dark mode)
- Interface responsiva (mobile-first)

### Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Monorepo | pnpm + Turborepo | Compartilhamento de código, cache de build eficiente |
| Frontend | Next.js 16.2 / React 19 | App Router estável, Server Components, Server Actions |
| Backend | NestJS 11 | Modular, TypeScript nativo, IoC container robusto |
| ORM | TypeORM 0.3 | Decorators TypeScript nativos, migrations automáticas, compatível com Postgres 17 |
| Cache / Sessão | Redis 7 | Alta performance, suporte a filas de jobs futuros |
| Containers | Docker Compose v2 | Ambientes isolados, reproduzíveis e portáteis |
| Auth | JWT + Refresh Token | Stateless, escalável, seguro com rotação de tokens |

---

## 2. Stack de Tecnologia

### Frontend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Next.js | 16.2.x | Framework React com SSR/SSG/RSC |
| React | 19.x | UI library com concurrent features |
| TypeScript | 5.x | Tipagem estática em toda a base |
| Tailwind CSS | 4.x | Estilização utilitária |
| Shadcn/ui | latest | Componentes acessíveis e customizáveis |
| TanStack Query | 5.x | Gerenciamento de estado servidor |
| Zod | 3.x | Validação de schemas no cliente |
| next-auth | 5.x (Auth.js) | Integração de autenticação no Next.js |

### Backend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| NestJS | 11.x | Framework Node.js modular |
| Node.js | 22.x (LTS) | Runtime |
| TypeScript | 5.x | Tipagem estática |
| TypeORM | 0.3.x | ORM e migrations |
| @nestjs/typeorm | 10.x | Integração TypeORM com NestJS |
| class-validator | 0.14.x | Validação de DTOs |
| class-transformer | 0.5.x | Serialização/deserialização |
| Passport.js | 0.7.x | Estratégias de autenticação |
| passport-jwt | 4.x | Estratégia JWT |
| bcrypt | 5.x | Hash de senhas |
| EventEmitter2 | 6.x | Eventos de domínio internos |
| Multer | 1.x | Upload de arquivos |
| @nestjs/swagger | 8.x | Documentação OpenAPI auto-gerada |

### Infraestrutura

| Tecnologia | Versão | Finalidade |
|---|---|---|
| PostgreSQL | 17 | Banco de dados relacional principal |
| Redis | 7 | Cache, sessões, blacklist de tokens |
| Docker | 27.x | Containerização |
| Docker Compose | v2 | Orquestração local |
| pnpm | 9.x | Package manager com workspaces |
| Turborepo | 2.x | Orchestração de tarefas no monorepo |

### Qualidade de Código

| Ferramenta | Finalidade |
|---|---|
| ESLint | Linting (regras TypeScript + React) |
| Prettier | Formatação de código |
| Husky | Git hooks (pre-commit) |
| lint-staged | Lint apenas nos arquivos staged |
| Jest | Testes unitários e de integração |
| Supertest | Testes de endpoints HTTP |
| Playwright | Testes end-to-end |

---

## 3. Estrutura do Monorepo

```
ged-systa/
│
├── apps/
│   ├── web/                            # Next.js 16.2 — App Router
│   └── api/                            # NestJS 11 — API REST
│
├── packages/
│   ├── @ged/ui/                        # Componentes compartilhados (Shadcn/ui base)
│   ├── @ged/types/                     # Tipos TypeScript e DTOs compartilhados
│   ├── @ged/utils/                     # Funções utilitárias puras (sem side effects)
│   ├── @ged/config/                    # Configurações base: tsconfig, eslint, tailwind
│   └── @ged/database/                  # Entidades TypeORM + migrations
│
├── infra/
│   ├── docker/
│   │   ├── web.Dockerfile              # Build multi-stage do Next.js
│   │   ├── api.Dockerfile              # Build multi-stage do NestJS
│   │   └── .dockerignore
│   └── docker-compose.yml             # Orquestração completa (dev + prod)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Pipeline de CI (lint, test, build)
│       └── deploy.yml                  # Pipeline de deploy (futuro)
│
├── turbo.json                          # Configuração do Turborepo
├── pnpm-workspace.yaml                 # Definição dos workspaces
├── package.json                        # Root package (scripts globais)
├── .env.example                        # Template de variáveis de ambiente
├── .gitignore
└── project.md                          # Este arquivo
```

---

## 4. Arquitetura do Backend — NestJS

### Estrutura de Diretórios

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts          # Repository Pattern
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── documents.module.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── documents.repository.ts
│   │   │   ├── commands/                    # CQRS — Commands (escrita)
│   │   │   │   ├── create-document.command.ts
│   │   │   │   ├── update-document.command.ts
│   │   │   │   └── delete-document.command.ts
│   │   │   ├── queries/                     # CQRS — Queries (leitura)
│   │   │   │   ├── get-document.query.ts
│   │   │   │   └── list-documents.query.ts
│   │   │   ├── events/                      # Eventos de domínio
│   │   │   │   └── document-uploaded.event.ts
│   │   │   └── dto/
│   │   │       ├── create-document.dto.ts
│   │   │       └── update-document.dto.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── categories.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-category.dto.ts
│   │   │       └── update-category.dto.ts
│   │   │
│   │   └── storage/
│   │       ├── storage.module.ts
│   │       ├── storage.service.ts           # Adapter Pattern — interface genérica
│   │       ├── adapters/
│   │       │   ├── local-storage.adapter.ts
│   │       │   └── s3-storage.adapter.ts
│   │       └── interfaces/
│   │           └── storage.interface.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Global exception filter
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts    # Padroniza o response body
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── database/
│   │   └── database.module.ts              # TypeORM Module de configuração
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── auth.config.ts
│   │   └── database.config.ts
│   │
│   ├── app.module.ts                       # Root module — importa todos os módulos
│   └── main.ts                             # Bootstrap da aplicação
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── package.json
└── Dockerfile                             # Symlink para infra/docker/api.Dockerfile
```

### Camadas da Clean Architecture no Backend

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION  →  Controllers, DTOs, Pipes, Guards           │
├──────────────────────────────────────────────────────────────┤
│  APPLICATION   →  Services, Commands, Queries, Use Cases     │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN        →  Entities, Interfaces, Domain Events        │
├──────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE →  Repositories (TypeORM), Storage, Cache    │
└──────────────────────────────────────────────────────────────┘
```

### Response Body Padrão

Todo endpoint retorna no formato padronizado pelo `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso",
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

Erros são padronizados pelo `HttpExceptionFilter`:

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado",
    "statusCode": 404
  },
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

---

## 5. Arquitetura do Frontend — Next.js

### Estrutura de Diretórios

```
apps/web/
├── src/
│   ├── app/                             # App Router (Next.js 16)
│   │   ├── layout.tsx                   # Root layout (providers, fonts)
│   │   ├── not-found.tsx
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx             # Página de login
│   │   └── (dashboard)/
│   │       ├── layout.tsx               # Layout com sidebar + header
│   │       ├── page.tsx                 # Dashboard principal
│   │       ├── documents/
│   │       │   ├── page.tsx             # Listagem de documentos
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx         # Detalhe do documento
│   │       │   └── upload/
│   │       │       └── page.tsx         # Upload de novo documento
│   │       ├── categories/
│   │       │   └── page.tsx
│   │       └── admin/
│   │           ├── users/
│   │           │   └── page.tsx
│   │           └── settings/
│   │               └── page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── documents/
│   │   │   ├── document-card.tsx
│   │   │   ├── document-table.tsx
│   │   │   └── upload-dropzone.tsx
│   │   └── ui/                          # Re-exports do @ged/ui
│   │
│   ├── hooks/
│   │   ├── use-documents.ts             # TanStack Query hooks
│   │   ├── use-categories.ts
│   │   └── use-auth.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts               # Fetch wrapper tipado para a API
│   │   ├── auth.ts                     # Configuração do Auth.js (next-auth)
│   │   └── utils.ts
│   │
│   ├── providers/
│   │   ├── query-provider.tsx          # TanStack Query Provider
│   │   └── theme-provider.tsx          # Dark/Light mode provider
│   │
│   └── types/
│       └── index.ts                    # Tipos locais do frontend
│
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Padrão de Dados — Server Components vs Client Components

```
Regra: dados que não precisam de interatividade → Server Component (RSC)
       dados que precisam de estado/interatividade → Client Component ('use client')

┌─────────────────────────┬──────────────────────────────┐
│   Server Component      │   Client Component           │
├─────────────────────────┼──────────────────────────────┤
│ Listagem de documentos  │ Upload com drag-and-drop     │
│ Páginas estáticas       │ Filtros interativos          │
│ Fetch de dados iniciais │ Formulários com validação    │
│ SEO / metadata          │ Theme toggle                 │
│ Layout e navegação      │ Modais e dropdowns           │
└─────────────────────────┴──────────────────────────────┘
```

---

## 6. Banco de Dados e Entidades TypeORM

As entidades TypeORM centralizadas residem em `packages/@ged/database/src/entities/`.

```typescript
// packages/@ged/database/src/entities/user.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.VIEWER })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Document, (doc) => doc.uploader)
  documents: Document[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];
}
```

```typescript
// packages/@ged/database/src/entities/refresh-token.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

```typescript
// packages/@ged/database/src/entities/category.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Document, (doc) => doc.category)
  documents: Document[];
}
```

```typescript
// packages/@ged/database/src/entities/document.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum DocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.ACTIVE })
  status: DocumentStatus;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category, (cat) => cat.documents)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}
```

---

## 7. Infraestrutura e Containers Docker

### Serviços Docker Compose

| Container | Imagem | Porta | Função |
|---|---|---|---|
| `web` | `ged-systa/web` | `3000:3000` | Frontend Next.js |
| `api` | `ged-systa/api` | `3333:3333` | Backend NestJS |
| `db` | `postgres:17-alpine` | `5432:5432` | Banco principal |
| `redis` | `redis:7-alpine` | `6379:6379` | Cache / sessões |
| `adminer` | `adminer:latest` | `8080:8080` | UI do banco (dev only) |

### `infra/docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:17-alpine
    container_name: ged-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ged-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ged-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ged-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: infra/docker/api.Dockerfile
    container_name: ged-api
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3333:3333"
    networks:
      - ged-network

  web:
    build:
      context: ..
      dockerfile: infra/docker/web.Dockerfile
    container_name: ged-web
    restart: unless-stopped
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://api:3333
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    ports:
      - "3000:3000"
    networks:
      - ged-network

  adminer:
    image: adminer:latest
    container_name: ged-adminer
    restart: unless-stopped
    profiles:
      - dev
    ports:
      - "8080:8080"
    networks:
      - ged-network

volumes:
  postgres_data:
  redis_data:

networks:
  ged-network:
    driver: bridge
```

### `infra/docker/api.Dockerfile` (Multi-stage)

```dockerfile
# Stage 1 — Dependências
FROM node:22-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter=api...

# Stage 2 — Build
FROM node:22-alpine AS builder
RUN npm install -g pnpm turbo
WORKDIR /app
COPY --from=deps /app .
COPY apps/api/ apps/api/
RUN pnpm turbo build --filter=api

# Stage 3 — Produção
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3333
CMD ["node", "dist/main.js"]
```

### `infra/docker/web.Dockerfile` (Multi-stage)

```dockerfile
# Stage 1 — Dependências
FROM node:22-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter=web...

# Stage 2 — Build
FROM node:22-alpine AS builder
RUN npm install -g pnpm turbo
WORKDIR /app
COPY --from=deps /app .
COPY apps/web/ apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter=web

# Stage 3 — Produção (Next.js standalone)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

---

## 8. Configuração do Monorepo

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "test/**"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:migrate:revert": {
      "cache": false
    }
  }
}
```

### `package.json` (root)

```json
{
  "name": "ged-systa",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check",
    "db:migrate": "pnpm --filter=@ged/database db:migrate",
    "db:migrate:revert": "pnpm --filter=@ged/database db:migrate:revert",
    "docker:up": "docker compose -f infra/docker-compose.yml up -d",
    "docker:down": "docker compose -f infra/docker-compose.yml down",
    "docker:dev": "docker compose -f infra/docker-compose.yml --profile dev up -d",
    "clean": "turbo clean && rimraf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.x",
    "rimraf": "^6.x",
    "prettier": "^3.x",
    "eslint": "^9.x",
    "typescript": "^5.x",
    "husky": "^9.x",
    "lint-staged": "^15.x"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.x.x"
}
```

---

## 9. Design Patterns Aplicados

### Repository Pattern

**Onde:** Camada de infrastructure (`*.repository.ts`) no NestJS.

**Por quê:** Abstrai o acesso ao banco de dados. Os Services não conhecem o TypeORM diretamente, apenas a interface do Repository. Facilita troca de ORM e mock em testes unitários.

```typescript
// interface
export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findAll(filters: DocumentFilters): Promise<PaginatedResult<Document>>;
  create(data: CreateDocumentData): Promise<Document>;
  update(id: string, data: UpdateDocumentData): Promise<Document>;
  delete(id: string): Promise<void>;
}

// implementação concreta (TypeORM)
@Injectable()
export class DocumentRepository implements IDocumentRepository { ... }
```

---

### Service Layer Pattern

**Onde:** `*.service.ts` — contém toda a lógica de negócio.

**Por quê:** Controllers são finos (apenas recebem requests e delegam). Services são testáveis de forma isolada. Regras de negócio centralizadas.

---

### CQRS (Command Query Responsibility Segregation)

**Onde:** Módulo `documents/` — separação em `commands/` e `queries/`.

**Por quê:** Documentos têm alta complexidade de leitura (filtros, paginação, busca) e de escrita (validações, eventos, versioning). Separar as responsabilidades melhora a manutenção e escalabilidade.

```
Command  →  CreateDocumentCommand → CreateDocumentHandler → Repository.create()
Query    →  ListDocumentsQuery   → ListDocumentsHandler  → Repository.findAll()
```

---

### Adapter Pattern

**Onde:** Módulo `storage/` — `LocalStorageAdapter` e `S3StorageAdapter`.

**Por quê:** Permite trocar o provider de armazenamento (local em dev, S3 em prod) sem alterar o código dos módulos consumidores. Ambos implementam a mesma interface `IStorageService`.

---

### Factory Pattern

**Onde:** Criação de entidades complexas (ex: `DocumentFactory`).

**Por quê:** Centraliza a criação de objetos com regras de negócio (ex: definir versão inicial, status padrão, slug do arquivo). Evita lógica de criação espalhada em múltiplos Services.

---

### Observer / Domain Events

**Onde:** `EventEmitter2` do NestJS para eventos como `DocumentUploadedEvent`.

**Por quê:** Desacopla reações a ações de domínio. Ex: ao fazer upload, o evento `document.uploaded` dispara listeners para indexação, notificação e auditoria sem acoplar o `DocumentService` a esses módulos.

---

### Dependency Injection (IoC Container)

**Onde:** Todo o NestJS. Providers, Services, Repositories são injetados via `@Injectable()` e registrados nos Modules.

**Por quê:** Inversão de controle facilita testes (mocks via `TestingModule`), desacoplamento e substituição de implementações.

---

### Module Pattern

**Onde:** Cada feature é um NestJS Module encapsulado (`DocumentsModule`, `AuthModule`, etc.).

**Por quê:** Alta coesão e baixo acoplamento. Cada módulo é auto-suficiente e exporta apenas o que outros módulos precisam consumir.

---

### Server Components + Server Actions (Next.js)

**Onde:** Páginas de listagem, layouts, fetching inicial de dados.

**Por quê:** React 19 + Next.js 16 privilegiam Server Components para reduzir JS enviado ao cliente, melhorar performance de carregamento e SEO. Server Actions substituem API routes para mutações simples do frontend.

---

## 10. Princípios de Engenharia de Software

### SOLID

| Princípio | Aplicação no projeto |
|---|---|
| **S** — Single Responsibility | Cada Service tem uma única responsabilidade de domínio. Controllers apenas roteiam. |
| **O** — Open/Closed | Extensão por novos Adapters de Storage sem modificar o código existente. |
| **L** — Liskov Substitution | `LocalStorageAdapter` e `S3StorageAdapter` são substituíveis por `IStorageService`. |
| **I** — Interface Segregation | Interfaces específicas (`IDocumentRepository`, `IStorageService`) em vez de interfaces genéricas gigantes. |
| **D** — Dependency Inversion | Services dependem de abstrações (interfaces), não de implementações concretas. |

---

### Clean Architecture

```
              ┌────────────────────────────────┐
              │      Presentation Layer         │
              │  Controllers · DTOs · Views     │
              ├────────────────────────────────┤
              │      Application Layer          │
              │  Services · Commands · Queries  │
              ├────────────────────────────────┤
              │        Domain Layer             │
              │  Entities · Interfaces · Events │
              ├────────────────────────────────┤
              │     Infrastructure Layer        │
              │  Repositories · TypeORM · Redis  │
              └────────────────────────────────┘
```

**Regra de Dependência:** camadas internas nunca dependem das externas. Infraestrutura implementa interfaces definidas no Domínio.

---

### DRY — Don't Repeat Yourself

- Tipos e DTOs compartilhados em `@ged/types`
- Componentes de UI reutilizáveis em `@ged/ui`
- Funções utilitárias em `@ged/utils`
- Nunca duplicar lógica de negócio entre módulos; extrair para Service ou package compartilhado

---

### KISS — Keep It Simple, Stupid

- Evitar abstrações prematuras. Só criar Repository se houver pelo menos 2 casos de uso
- Preferir código legível a código "inteligente"
- Endpoints REST simples e previsíveis antes de considerar GraphQL
- Componentes React pequenos e focados (máx. ~150 linhas por arquivo de componente)

---

### YAGNI — You Aren't Gonna Need It

- Não implementar features sem requisito concreto (ex: não criar busca full-text antes de ter documento cadastrado)
- Não criar abstrações para casos de uso únicos
- Não configurar multi-tenancy antes da necessidade ser confirmada

---

### Fail Fast

- Validação de DTOs com `class-validator` na entrada da API
- Validação de variáveis de ambiente com Zod no startup da aplicação
- Retornar erros claros e explícitos em vez de continuar com estado inválido

---

## 11. Estratégia de Testes

### Pirâmide de Testes

```
        /\
       /  \    E2E (Playwright) — fluxos críticos do usuário
      /────\
     /      \  Integração (Supertest) — endpoints da API com banco real
    /────────\
   /          \ Unitários (Jest) — Services, Repositories, utils
  /────────────\
```

### Testes Unitários (Jest)

- **O quê:** Services, Repositories, funções utilitárias, pipes, guards
- **Onde:** `*.spec.ts` ao lado do arquivo testado
- **Regra:** Mockar todas as dependências externas (banco, redis, storage)
- **Cobertura mínima:** 80% nas camadas `service` e `repository`

### Testes de Integração (Supertest + NestJS TestingModule)

- **O quê:** Controllers + Services com banco de dados real (PostgreSQL de teste)
- **Onde:** `apps/api/test/integration/`
- **Setup:** Banco isolado por suite (seed + teardown)

### Testes E2E (Playwright)

- **O quê:** Fluxos críticos do usuário: login → upload de documento → visualizar → logout
- **Onde:** `apps/web/test/e2e/`
- **Ambiente:** Docker Compose de testes isolado

### Scripts de Teste

```bash
# Rodar todos os testes do monorepo
pnpm turbo test

# Somente testes unitários da API
pnpm --filter=api test

# Testes E2E
pnpm --filter=web test:e2e

# Cobertura
pnpm --filter=api test:cov
```

---

## 12. Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` | `document-upload.service.ts` |
| Classes / Interfaces | `PascalCase` | `DocumentService`, `IStorageService` |
| Funções / Métodos | `camelCase` | `uploadDocument()`, `findById()` |
| Variáveis / Parâmetros | `camelCase` | `documentId`, `uploadedAt` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Enums | `PascalCase` (nome) + `SCREAMING_SNAKE_CASE` (valores) | `Role.ADMIN` |
| Colunas do banco | `snake_case` (via `@Column({ name })`) | `created_at`, `file_name` |
| Tabelas do banco | `snake_case` plural | `documents`, `refresh_tokens` |

### Estrutura de Pastas

- Um arquivo por classe/componente
- Arquivos de teste `*.spec.ts` ao lado do arquivo testado
- `index.ts` de barrel export em cada pasta de feature (`export * from './...'`)

### Commits — Conventional Commits

```
feat(documents): adiciona endpoint de upload de documentos
fix(auth): corrige rotação de refresh token expirado
chore(deps): atualiza typeorm para 0.3.x
docs(readme): atualiza instruções de setup
test(documents): adiciona testes unitários no DocumentService
refactor(storage): extrai adapter S3 do StorageService
```

### Code Style

- **Prettier** configurado no root: `printWidth: 100`, `singleQuote: true`, `trailingComma: 'all'`
- **ESLint** com regras TypeScript strict + React hooks
- **Husky** + **lint-staged**: roda lint e prettier automaticamente no `pre-commit`

---

## 13. Variáveis de Ambiente

### `.env.example` (root — template obrigatório)

```dotenv
# ─── Banco de Dados ───────────────────────────────────────────
DB_USER=ged_user
DB_PASSWORD=ged_password
DB_NAME=ged_systa
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# ─── Redis ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Autenticação ─────────────────────────────────────────────
JWT_SECRET=troque-por-um-segredo-forte-de-pelo-menos-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outro-segredo-forte-diferente-do-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d

# ─── Next.js / Auth.js ────────────────────────────────────────
NEXTAUTH_SECRET=troque-por-um-segredo-forte
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333

# ─── Storage ──────────────────────────────────────────────────
STORAGE_DRIVER=local         # local | s3
STORAGE_LOCAL_PATH=./uploads
# S3 (somente se STORAGE_DRIVER=s3)
# AWS_BUCKET=ged-systa-docs
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# ─── Aplicação ────────────────────────────────────────────────
NODE_ENV=development
PORT=3333
```

### Regra: Validação de Env no Bootstrap

O `apps/api/src/config/` usa `@nestjs/config` + Zod para validar todas as variáveis obrigatórias no startup. A aplicação **não sobe** se alguma variável crítica estiver ausente.

```typescript
// config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3333),
});
```

---

## 14. Scripts e Pipeline Turborepo

### Scripts disponíveis (raiz do monorepo)

```bash
# Desenvolvimento (todos os apps em paralelo)
pnpm dev

# Build de produção (com cache Turborepo)
pnpm build

# Lint em todos os packages
pnpm lint

# Testes
pnpm test

# Type checking
pnpm type-check

# Banco de dados
pnpm db:migrate           # Rodar migrations TypeORM
pnpm db:migrate:revert    # Reverter última migration

# Docker
pnpm docker:dev           # Subir containers + adminer (dev)
pnpm docker:up            # Subir containers (prod)
pnpm docker:down          # Derrubar containers

# Limpar cache e node_modules
pnpm clean
```

### Ordem de Dependência de Build (Turborepo)

```
@ged/config  ──►  @ged/types  ──►  @ged/utils  ──►  @ged/ui
                                        │
                                   @ged/database
                                        │
                               ┌────────┴────────┐
                              api               web
```

---

## 15. Fluxo de Desenvolvimento (Git Flow)

### Branches

| Branch | Finalidade |
|---|---|
| `main` | Código de produção estável. Nunca commitar diretamente. |
| `develop` | Branch de integração. PRs aprovados são mergeados aqui. |
| `feature/nome-da-feature` | Nova funcionalidade. Criada a partir de `develop`. |
| `fix/nome-do-bug` | Correção de bug. Criada a partir de `develop`. |
| `hotfix/nome-do-fix` | Correção crítica em produção. Criada a partir de `main`. |
| `release/x.y.z` | Preparação de release. Criada a partir de `develop`. |

### Fluxo de uma Feature

```
1. git checkout develop
2. git pull origin develop
3. git checkout -b feature/upload-de-documentos
4. (desenvolvimento + commits Conventional Commits)
5. git push origin feature/upload-de-documentos
6. Abrir Pull Request → develop
7. Code review + CI aprovados → Merge (Squash)
8. Deletar branch da feature
```

### Regras de Pull Request

- Título segue Conventional Commits
- CI (lint + tests + build) deve passar antes do merge
- Ao menos 1 aprovação necessária
- Sem `--force push` em branches compartilhadas
- PRs devem ser pequenos e focados (max ~400 linhas alteradas)

---

*Documento gerado em: 28 de abril de 2026*
*Versão: 1.0.0*
