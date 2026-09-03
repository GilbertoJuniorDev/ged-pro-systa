// "2026-001", "2026-002", ... Acima de 999 numa mesma dupla departamento/ano o padStart
// simplesmente deixa de preencher com zero ("2026-1000") — aceito, não é tratado como erro.
export function formatArquivoCodigo(ano: number, sequencia: number): string {
  return `${ano}-${String(sequencia).padStart(3, '0')}`;
}
