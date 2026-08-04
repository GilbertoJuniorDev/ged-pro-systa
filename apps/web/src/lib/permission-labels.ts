/** Rótulos e descrições PT-BR para permissões — fonte única para listagens de admin. */
export const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  LOGS_VIEW: { label: 'Ver logs do sistema', description: 'Visualizar logs de erro do sistema.' },
  SETTINGS_VIEW: { label: 'Ver configurações', description: 'Visualizar as configurações do sistema.' },
  SETTINGS_EDIT: { label: 'Editar configurações', description: 'Alterar as configurações do sistema.' },
  DOCUMENTS_MANAGE_CONFIDENTIALITY: {
    label: 'Gerenciar confidencialidade',
    description: 'Definir quem pode acessar documentos sigilosos.',
  },
  DOCUMENTS_CREATE: { label: 'Criar documentos', description: 'Enviar novos documentos ao sistema.' },
  DOCUMENTS_EDIT: { label: 'Editar documentos', description: 'Editar e transferir documentos existentes.' },
  DOCUMENTS_DELETE: { label: 'Excluir documentos', description: 'Remover documentos do sistema.' },
  DOSSIES_MANAGE: { label: 'Gerenciar dossiês', description: 'Criar, editar e remover dossiês.' },
  DOCUMENT_SERIES_MANAGE: {
    label: 'Gerenciar séries documentais',
    description: 'Criar, editar e remover séries documentais.',
  },
};

function fallbackLabel(nome: string): string {
  return nome
    .toLowerCase()
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

export function permissionLabel(
  nome: string,
  descricao?: string | null,
): { label: string; description: string } {
  const known = PERMISSION_LABELS[nome];
  if (known) return known;
  return { label: fallbackLabel(nome), description: descricao ?? 'Sem descrição.' };
}
