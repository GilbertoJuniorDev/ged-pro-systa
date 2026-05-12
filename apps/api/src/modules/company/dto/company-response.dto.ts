export class CompanyResponseDto {
  readonly id!: string;
  readonly cnpj!: string;
  readonly razaoSocial!: string;
  readonly nomeFantasia!: string | null;
  readonly nomeEmpresarial!: string | null;
  readonly inscricaoEstadual!: string | null;
  readonly matriz!: boolean;
  readonly dataAbertura!: string | null;
  readonly porte!: string | null;
  readonly naturezaJuridicaCodigo!: string | null;
  readonly naturezaJuridicaDescricao!: string | null;
  readonly situacaoCadastral!: string | null;
  readonly situacaoCadastralData!: string | null;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(partial: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    nomeEmpresarial: string | null;
    inscricaoEstadual: string | null;
    matriz: boolean;
    dataAbertura: Date | null;
    porte: string | null;
    naturezaJuridicaCodigo: string | null;
    naturezaJuridicaDescricao: string | null;
    situacaoCadastral: string | null;
    situacaoCadastralData: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = partial.id;
    this.cnpj = partial.cnpj;
    this.razaoSocial = partial.razaoSocial;
    this.nomeFantasia = partial.nomeFantasia;
    this.nomeEmpresarial = partial.nomeEmpresarial;
    this.inscricaoEstadual = partial.inscricaoEstadual;
    this.matriz = partial.matriz;
    this.dataAbertura = partial.dataAbertura ? toIsoDate(partial.dataAbertura) : null;
    this.porte = partial.porte;
    this.naturezaJuridicaCodigo = partial.naturezaJuridicaCodigo;
    this.naturezaJuridicaDescricao = partial.naturezaJuridicaDescricao;
    this.situacaoCadastral = partial.situacaoCadastral;
    this.situacaoCadastralData = partial.situacaoCadastralData
      ? toIsoDate(partial.situacaoCadastralData)
      : null;
    this.createdAt = partial.createdAt.toISOString();
    this.updatedAt = partial.updatedAt.toISOString();
  }
}

function toIsoDate(value: Date | string): string {
  if (typeof value === 'string') return value;
  return value.toISOString().slice(0, 10);
}
