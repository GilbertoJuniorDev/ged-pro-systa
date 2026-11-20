# GED

Gestão Eletrônica de Documentos: guarda, classifica e controla o acesso aos documentos de uma organização ao longo do seu ciclo de vida.

## Language

### Acervo

**Acervo**:
O conjunto de tudo que o GED guarda: Arquivos, Dossiês, Documentos e Avulsos.
_Avoid_: Documentos (como nome da área), repositório

**Arquivo**:
Unidade arquivística de um departamento, identificada por código e ano, com localização física (prédio, sala, estante, prateleira, caixa) e que pode ser encerrada. Nunca o binário de um Documento.
_Avoid_: Pasta, caixa, "arquivo" no sentido de ficheiro/upload

**Documento**:
Registro de um documento no Acervo: seus metadados, classificação e confidencialidade, mais exatamente um Conteúdo.
_Avoid_: Arquivo, file

**Protocolar**:
Ato de dar entrada de um novo Documento no Acervo.
_Avoid_: Upload, enviar, subir

### Armazenamento

**Conteúdo**:
O binário de um Documento (PDF, imagem etc.) guardado no Storage, identificado por uma Chave.
_Avoid_: Arquivo, anexo, upload, file

**Storage**:
O repositório externo onde os Conteúdos ficam guardados, fora do banco de dados.
_Avoid_: Drive, bucket (como termo de domínio), nuvem

**Chave**:
Identificador opaco de um Conteúdo dentro do Storage; não carrega nome nem significado de negócio.
_Avoid_: ID do arquivo, path, URL

### Aparência

**Aparência do Sistema**:
A identidade visual da área autenticada e da tela de login, definida pelo admin: uma Paleta e um Logo.
_Avoid_: tema, layout, skin

**Aparência do Portal**:
A identidade visual do portal público, independente da Aparência do Sistema: sua própria Paleta, Logo e textos.
_Avoid_: tema do portal

**Paleta**:
As cores escolhidas pelo admin (primária, secundária, fundo) das quais toda a interface deriva suas cores, nos dois Temas.
_Avoid_: tema, padrão de cor, cores do sistema

**Tema**:
A escolha de cada usuário entre claro e escuro; muda a luminosidade da interface, nunca a Paleta.
_Avoid_: aparência, paleta, modo

**Logo**:
A imagem de marca enviada pelo admin para uma Aparência; na ausência dela, vale a marca padrão do GED.
_Avoid_: ícone, avatar, imagem
