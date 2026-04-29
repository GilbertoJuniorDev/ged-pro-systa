---
description: "Use when writing tests: unit tests with Jest, integration tests with Supertest, or E2E tests with Playwright. Covers mock strategy, test isolation, naming patterns, coverage requirements, and the test pyramid for the GED Systa project."
applyTo: "**/*.spec.ts"
---

# Estratégia de Testes

## Pirâmide de Testes

```
       /\
      /  \    E2E (Playwright) — fluxos críticos do usuário
     /────\
    /      \  Integração (Supertest) — endpoints da API com banco real
   /────────\
  /          \ Unitários (Jest) — Services, Repositories, utils
 /────────────\
```

## Testes Unitários (Jest)

- **O quê:** Services, Repositories, funções utilitárias, pipes, guards, interceptors
- **Onde:** `*.spec.ts` ao lado do arquivo testado (co-located)
- **Regra:** Mockar **todas** as dependências externas (banco, Redis, storage)
- **Cobertura mínima:** 80% nas camadas `service` e `repository`

```typescript
// Estrutura padrão de teste unitário NestJS
describe('DocumentService', () => {
  let service: DocumentService;
  let mockRepository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: IDocumentRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('should throw NotFoundException when document not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
  });
});
```

## Testes de Integração (Supertest)

- **O quê:** Controllers + Services com banco de dados PostgreSQL real (instância de teste)
- **Onde:** `apps/api/test/integration/`
- **Setup:** Banco isolado por suite — seed antes, teardown depois
- **Ambiente:** Variáveis de ambiente de teste via `.env.test`

```typescript
// Padrão de teste de integração
describe('DocumentsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('POST /documents → 201', () => {
    return request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send(validCreateDocumentDto)
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.id).toBeDefined();
      });
  });
});
```

## Testes E2E (Playwright)

- **O quê:** Fluxos críticos do usuário
- **Onde:** `apps/web/test/e2e/`
- **Ambiente:** Docker Compose de testes isolado
- **Fluxos obrigatórios:** login → upload de documento → visualizar → logout

```typescript
// Padrão de teste E2E Playwright
test('login e upload de documento', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'admin@ged.com');
  await page.fill('[data-testid="password"]', 'senha-segura');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Regras Gerais

- Nomes de teste: `'should [comportamento] when [condição]'`
- Um `describe` por classe/módulo; um `it`/`test` por comportamento
- Não usar `console.log` em testes — usar `expect` para asserções
- Não compartilhar estado mutável entre testes — cada `it` deve ser independente
- Arquivos de fixture e factories em `test/factories/`
