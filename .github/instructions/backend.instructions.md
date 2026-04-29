---
description: "Use when writing NestJS API code: controllers, services, repositories, DTOs, guards, interceptors, pipes, filters, or any backend module in apps/api/. Covers Clean Architecture layers, response body format, and design pattern implementations."
applyTo: "apps/api/**"
---

# Backend — NestJS (apps/api/)

## Camadas da Clean Architecture

```
┌──────────────────────────────────────────────────────┐
│  PRESENTATION   →  Controllers, DTOs, Pipes, Guards  │
├──────────────────────────────────────────────────────┤
│  APPLICATION    →  Services, Commands, Queries       │
├──────────────────────────────────────────────────────┤
│  DOMAIN         →  Entities, Interfaces, Events      │
├──────────────────────────────────────────────────────┤
│  INFRASTRUCTURE →  Repositories (TypeORM), Redis     │
└──────────────────────────────────────────────────────┘
```

**Regra:** camadas internas nunca dependem das externas. Infraestrutura implementa interfaces definidas no Domínio.

## Estrutura de Diretórios

```
apps/api/src/
├── modules/
│   ├── auth/           # JWT + Refresh Token strategies
│   ├── users/          # CRUD de usuários, RBAC (ADMIN/MANAGER/VIEWER)
│   ├── documents/      # CQRS: commands/ + queries/ + events/
│   ├── categories/     # Categorização de documentos
│   └── storage/        # Adapter Pattern: local | S3
├── common/
│   ├── decorators/     # @CurrentUser(), @Public(), @Roles()
│   ├── filters/        # HttpExceptionFilter (global)
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   ├── interceptors/   # LoggingInterceptor, TransformInterceptor
│   └── pipes/          # ValidationPipe
├── database/           # TypeORM Module de configuração
├── config/             # app.config, auth.config, database.config, env.validation
├── app.module.ts       # Root module
└── main.ts             # Bootstrap
```

## Response Body Padrão

Todo endpoint retorna via `TransformInterceptor`:

```json
{
  "success": true,
  "data": { },
  "message": "Operação realizada com sucesso",
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

Erros via `HttpExceptionFilter`:

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

## Repository Pattern

Services **nunca** importam diretamente TypeORM — sempre via interface:

```typescript
// domain/interfaces/document-repository.interface.ts
export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findAll(filters: DocumentFilters): Promise<PaginatedResult<Document>>;
  create(data: CreateDocumentData): Promise<Document>;
  update(id: string, data: UpdateDocumentData): Promise<Document>;
  delete(id: string): Promise<void>;
}

// infrastructure/repositories/document.repository.ts
@Injectable()
export class DocumentRepository implements IDocumentRepository { ... }
```

## CQRS — Módulo Documents

```
Command → CreateDocumentCommand → CreateDocumentHandler → Repository.create()
Query   → ListDocumentsQuery   → ListDocumentsHandler  → Repository.findAll()
```

Arquivos em `modules/documents/commands/` (escrita) e `modules/documents/queries/` (leitura).

## Adapter Pattern — Storage

```typescript
// modules/storage/interfaces/storage.interface.ts
export interface IStorageService {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

// Adapters implementam IStorageService:
// modules/storage/adapters/local-storage.adapter.ts  → STORAGE_DRIVER=local
// modules/storage/adapters/s3-storage.adapter.ts     → STORAGE_DRIVER=s3
```

## Domain Events

```typescript
// Emitir evento ao fazer upload:
this.eventEmitter.emit('document.uploaded', new DocumentUploadedEvent(document));

// Listener desacoplado (indexação, notificação, auditoria):
@OnEvent('document.uploaded')
async handleDocumentUploaded(event: DocumentUploadedEvent) { ... }
```

## Regras Obrigatórias

- Controllers são **finos**: recebem request, chamam Service, retornam response
- Validação de DTOs via `class-validator` + `class-transformer` em todo endpoint de escrita
- `@nestjs/swagger` com `@ApiTags`, `@ApiOperation`, `@ApiResponse` em todos os controllers
- Providers registrados via `@Injectable()` e declarados no `providers[]` do Module
- Secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`) com mínimo de 32 caracteres — validados via Zod no startup
