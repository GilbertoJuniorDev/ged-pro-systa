# Variáveis de Ambiente — GED Pro

Copie `.env.example` para `.env` e preencha os valores. **Nunca** commite o `.env` com valores reais.

## Template `.env.example`

```dotenv
# ─── Banco de Dados ───────────────────────────────────────────────────────────
DB_USER=ged_user
DB_PASSWORD=ged_password
DB_NAME=ged_systa
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── MongoDB (logs de erro) ───────────────────────────────────────────────────
MONGO_URL=mongodb://localhost:27017/ged_logs

# ─── Autenticação JWT ─────────────────────────────────────────────────────────
JWT_SECRET=troque-por-um-segredo-forte-de-pelo-menos-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outro-segredo-forte-diferente-do-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d

# ─── Next.js / Auth.js ────────────────────────────────────────────────────────
NEXTAUTH_SECRET=troque-por-um-segredo-forte
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333

# ─── Storage ─────────────────────────────────────────────────────────────────
STORAGE_MAX_FILE_SIZE=26214400

# ─── E-mail (SMTP) ───────────────────────────────────────────────────────────
MAIL_HOST=localhost        # MailHog em dev; ex: smtp.sendgrid.net em prod
MAIL_PORT=1025             # 1025 MailHog | 587 STARTTLS | 465 SSL
MAIL_SECURE=false          # true apenas para porta 465 (SSL direto)
MAIL_USER=                 # vazio para MailHog
MAIL_PASS=                 # vazio para MailHog
MAIL_FROM=noreply@ged.local

# ─── Aplicação ────────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3333
```

## Validação no Startup da API

`apps/api/src/config/env.validation.ts` usa Zod para validar **todas** as variáveis críticas ao iniciar.
A aplicação **não sobe** se qualquer variável obrigatória estiver ausente ou inválida — esse arquivo é a
fonte de verdade do schema; não duplicar aqui, para não divergir dele com o tempo.

Em Docker, essas variáveis precisam estar listadas no bloco `environment:` do serviço `api` em
`infra/docker-compose*.yml` — estar só no `.env` da raiz não basta, o compose só repassa ao container
o que está explicitamente mapeado lá.

## Variáveis por Serviço

| Variável | Serviço | Obrigatória | Padrão |
|---|---|---|---|
| `DATABASE_URL` | API | ✅ | — |
| `REDIS_URL` | API | — | `redis://localhost:6379` |
| `MONGO_URL` | API | — | `mongodb://localhost:27017/ged_logs` |
| `JWT_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | API | ✅ (≥32 chars) | — |
| `JWT_EXPIRES_IN` | API | — | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | API | — | `7d` |
| `MAIL_HOST` | API | ✅ | — |
| `STORAGE_MAX_FILE_SIZE` | API | — | `26214400` (25 MiB) |
| `NEXTAUTH_SECRET` | Web | ✅ | — |
| `NEXTAUTH_URL` | Web | ✅ | — |
| `NEXT_PUBLIC_API_URL` | Web | ✅ | — |

## Ambientes

| Arquivo | Uso |
|---|---|
| `.env` | Desenvolvimento local (não commitado) |
| `.env.example` | Template commitado — manter atualizado com toda nova variável |
| `.env.test` | Testes de integração — banco e Redis de teste isolados |
| Variáveis de CI/CD | Injetadas pelo pipeline (GitHub Actions Secrets) |

## Storage — provisionamento do S3 em produção

O Conteúdo dos Documentos fica no AWS S3 (ver [ADR 0001](adr/0001-s3-como-storage.md) e o vocabulário
em `GLOSSARY.md`: Conteúdo, Storage, Chave). O bucket **não** é criado pela aplicação: ele é
provisionado uma vez, por uma pessoa com credenciais administrativas na AWS, seguindo os passos
abaixo. A API (rodando na VPS) acessa o bucket com um usuário IAM dedicado e permissão mínima.

Os comandos usam a [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
autenticada com um perfil **administrativo** (não com a credencial da aplicação). Defina antes:

```bash
export BUCKET=ged-conteudos-prod   # nome globalmente único
export REGION=sa-east-1            # região do bucket
```

### 1. Criar o bucket privado

```bash
# Em us-east-1, omita a linha --create-bucket-configuration
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"
```

### 2. Block Public Access (as 4 opções ligadas)

```bash
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

O download sempre passa pela API (sem presigned URL), então o bucket nunca precisa ser público.

### 3. Criptografia padrão SSE-S3

```bash
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### 4. Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
```

### 5. Lifecycle: versões não-correntes expiram em 90 dias

Salve como `lifecycle.json`:

```json
{
  "Rules": [
    {
      "ID": "expirar-versoes-nao-correntes-90d",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": { "NoncurrentDays": 90 },
      "Expiration": { "ExpiredObjectDeleteMarker": true }
    }
  ]
}
```

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration file://lifecycle.json
```

- `NoncurrentVersionExpiration` apaga definitivamente as versões antigas 90 dias depois de deixarem
  de ser correntes (ex.: depois que um Documento é excluído).
- `ExpiredObjectDeleteMarker` remove os delete markers que ficaram sozinhos (sem nenhuma versão por
  trás), para não acumular lixo no bucket.
- A expiração por lifecycle é **assíncrona**: a AWS processa as regras em lote e a remoção efetiva
  pode atrasar **~1 dia** além dos 90 dias. Não conte com o prazo exato.

### 6. Usuário IAM dedicado à aplicação

Política mínima — só `s3:PutObject`, `s3:GetObject` e `s3:DeleteObject` nos objetos do bucket;
**sem** `ListBucket`, `CreateBucket` nem acesso a outros buckets. Salve como
`ged-storage-policy.json`, trocando `<bucket>` pelo nome do bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GedConteudos",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<bucket>/*"
    }
  ]
}
```

```bash
sed -i "s/<bucket>/$BUCKET/" ged-storage-policy.json

aws iam create-user --user-name ged-api-storage
aws iam put-user-policy \
  --user-name ged-api-storage \
  --policy-name ged-storage \
  --policy-document file://ged-storage-policy.json

# Gera AccessKeyId / SecretAccessKey — o secret só aparece nesta saída; guarde num cofre
aws iam create-access-key --user-name ged-api-storage
```

O usuário não precisa de acesso ao console. Para rotacionar a chave: crie uma nova, atualize a VPS,
reinicie a API e só então rode `aws iam delete-access-key` na antiga.

### 7. Conferência

```bash
aws s3api get-public-access-block --bucket "$BUCKET"
aws s3api get-bucket-encryption --bucket "$BUCKET"
aws s3api get-bucket-versioning --bucket "$BUCKET"   # "Status": "Enabled"
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET"
aws iam get-user-policy --user-name ged-api-storage --policy-name ged-storage
```

### 8. Variáveis `S3_*` na VPS

Nomes conforme o schema em `apps/api/src/config/env.validation.ts` (a API não sobe se faltar uma
obrigatória):

| Variável | Obrigatória | Valor em produção (AWS) |
|---|---|---|
| `S3_BUCKET` | ✅ | Nome do bucket (`$BUCKET`) |
| `S3_REGION` | ✅ | Região do bucket (`$REGION`) |
| `S3_ACCESS_KEY_ID` | ❌\* | `AccessKeyId` do usuário `ged-api-storage` |
| `S3_SECRET_ACCESS_KEY` | ❌\* | `SecretAccessKey` do usuário `ged-api-storage` |
| `S3_ENDPOINT` | ❌ | Vazio na AWS |
| `S3_FORCE_PATH_STYLE` | ❌ (default `false`) | `false` na AWS |

\* `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` devem ser definidas **juntas** (o schema rejeita só
uma delas). Se ambas ficarem vazias, o SDK usa a cadeia padrão de credenciais da AWS (variáveis
`AWS_*`, `~/.aws`, role de instância) — numa VPS fora da AWS, na prática, **defina as duas**.

```bash
S3_BUCKET=ged-conteudos-prod
S3_REGION=sa-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
```

**Provedores compatíveis com S3 (Cloudflare R2, Wasabi etc.):** defina `S3_ENDPOINT` com a URL da
API S3 do provedor e, se ele não suportar virtual-hosted style (bucket no hostname), use
`S3_FORCE_PATH_STYLE=true`. Exemplos:

| Provedor | `S3_ENDPOINT` | `S3_REGION` | `S3_FORCE_PATH_STYLE` |
|---|---|---|---|
| Cloudflare R2 | `https://<account-id>.r2.cloudflarestorage.com` | `auto` | `true` |
| Wasabi | `https://s3.<região>.wasabisys.com` | a região Wasabi (ex.: `us-east-1`) | `false` |
| MinIO | `http://<host>:9000` | `us-east-1` | `true` |

Nesses provedores, os equivalentes de Block Public Access, criptografia, versioning e lifecycle
precisam ser configurados pelas ferramentas de cada um — os comandos acima são da AWS.

### 9. Recuperar um Conteúdo excluído (janela de 90 dias)

Excluir um Documento apaga **a linha no banco** e faz um `DeleteObject` no S3. Com versioning, o S3
não apaga o binário: cria um **delete marker** e a versão anterior vira não-corrente, que o
lifecycle expira após 90 dias. Dentro dessa janela o Conteúdo pode ser recuperado manualmente, com
credencial administrativa (o usuário da aplicação não tem `ListBucket`/`ListBucketVersions`):

```bash
# 1. Localize a Chave. Ela é opaca (documentos/{yyyy}/{mm}/{uuid}) e a linha do banco foi
#    apagada — use um backup do banco ou filtre pelo prefixo do mês de upload e pela data do
#    delete marker:
aws s3api list-object-versions \
  --bucket "$BUCKET" \
  --prefix "documentos/2026/11/" \
  --query 'DeleteMarkers[?IsLatest==`true`].[Key,VersionId,LastModified]' \
  --output table

# 2. Remova o delete marker (VersionId do marker, não do objeto); a versão anterior volta a ser
#    a corrente:
aws s3api delete-object \
  --bucket "$BUCKET" \
  --key "documentos/2026/11/<uuid>" \
  --version-id "<VersionId-do-delete-marker>"
```

> ⚠️ **Isso restaura só o binário.** O Documento (metadados, classificação, confidencialidade, nome
> original) **não volta**: ele precisa ser recriado no banco apontando para a mesma Chave, a partir
> de um backup do banco ou manualmente. Versioning é **rede de segurança operacional**, não lixeira
> — não existe "desfazer exclusão" para o usuário. Passados os 90 dias (+ atraso do lifecycle) o
> Conteúdo é apagado definitivamente.

### Desenvolvimento local (MinIO)

Em desenvolvimento, o Storage é um MinIO subido pelo `infra/docker-compose.dev.yml`: o serviço
`minio` (API S3 em `http://localhost:9000`) e o `minio-init`, que cria o bucket (`S3_BUCKET`,
default `ged-conteudos`) e liga o versioning. A API no compose já recebe
`S3_ENDPOINT=http://minio:9000`, `S3_FORCE_PATH_STYLE=true` e as credenciais root do MinIO
(`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`, default `minioadmin`). Nenhum dos passos acima é
necessário localmente.
