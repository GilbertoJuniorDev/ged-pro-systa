import type { PublicDocumentDto } from '@ged/types';

// Input construído campo-a-campo pelo service (nunca um spread da entidade Document) —
// só os campos explicitamente listados aqui podem chegar à resposta pública. Em
// particular, `arquivoChave` (ID do arquivo no Google Drive) e `departamentoId` NUNCA
// aparecem nesta interface, então não há como um `...document` acidental vazá-los.
interface PublicDocumentResponseInput {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly arquivoNome: string;
  readonly arquivoMimeType: string;
  readonly arquivoTamanho: number;
  readonly serie: { readonly id: string; readonly codigo: string; readonly nome: string };
  readonly destaque: boolean;
  readonly exigeCadastro: boolean;
  readonly createdAt: Date;
}

export class PublicDocumentResponseDto implements PublicDocumentDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly arquivoNome: string;
  readonly arquivoMimeType: string;
  readonly arquivoTamanho: number;
  readonly serie: { readonly id: string; readonly codigo: string; readonly nome: string };
  readonly destaque: boolean;
  readonly exigeCadastro: boolean;
  readonly createdAt: string;

  constructor(input: PublicDocumentResponseInput) {
    this.id = input.id;
    this.nome = input.nome;
    this.descricao = input.descricao;
    this.arquivoNome = input.arquivoNome;
    this.arquivoMimeType = input.arquivoMimeType;
    this.arquivoTamanho = input.arquivoTamanho;
    this.serie = { id: input.serie.id, codigo: input.serie.codigo, nome: input.serie.nome };
    this.destaque = input.destaque;
    this.exigeCadastro = input.exigeCadastro;
    this.createdAt = input.createdAt.toISOString();
  }
}
