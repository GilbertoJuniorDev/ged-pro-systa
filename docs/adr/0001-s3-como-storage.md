---
status: accepted
---

# S3 como Storage dos Conteúdos

O Conteúdo dos Documentos passa a ser guardado no AWS S3 (MinIO em desenvolvimento) no lugar do Google Drive, via o adapter que implementa `IStorageService`. A troca é seca: o sistema não estava em produção, então não há migração nem coexistência de provedores. O bucket é provisionado fora da aplicação e a API acessa com um usuário IAM dedicado (a produção roda em VPS) com política mínima — apenas `PutObject`, `GetObject` e `DeleteObject` no bucket, sem `ListBucket` nem `CreateBucket`.

## Consequences

- **Download continua passando pela API**, sem presigned URL: a checagem de access-scope, a confidencialidade e o portal público dependem de a API mediar cada leitura. Presigned URL só deve ser reconsiderada se a banda da VPS virar gargalo, e precisaria reimplementar esses controles.
- **Versioning ligado não é lixeira.** Apagar um Documento remove a linha no banco de verdade; o Conteúdo vira versão não-corrente no S3 e é expirado por lifecycle após **90 dias**. Isso é rede de segurança operacional (recuperação manual pelo console), não um soft delete visível ao usuário — uma lixeira de Documentos é feature separada.
- **A Chave é opaca** (`documentos/{yyyy}/{mm}/{uuid}`): não contém o nome original, que vive só no banco.
- Object Lock / retenção por temporalidade da série ficaram fora; exigiriam bucket novo quando forem adotados.
