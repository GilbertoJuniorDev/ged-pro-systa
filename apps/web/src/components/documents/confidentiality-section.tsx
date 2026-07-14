'use client';

import { Lock } from 'lucide-react';
import { CONFIDENCIALIDADE, type Confidencialidade } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useDepartments } from '@/hooks/use-departments';
import { useUsers } from '@/hooks/use-users';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { MultiCombobox } from '@/components/ui/multi-combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfidentialitySectionValue {
  confidencialidade: Confidencialidade;
  accessDepartamentoIds: string[];
  accessUserIds: string[];
  exigeCadastro: boolean;
  destaque: boolean;
}

export interface ConfidentialitySectionProps {
  readonly value: ConfidentialitySectionValue;
  readonly onChange: (value: ConfidentialitySectionValue) => void;
  readonly canManage: boolean;
  readonly errors?: { confidencialidade?: string; accessUserIds?: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_OPTIONS: readonly ComboboxOption[] = [
  { value: CONFIDENCIALIDADE.PUBLICO, label: 'Público' },
  { value: CONFIDENCIALIDADE.RESTRITO, label: 'Restrito' },
  { value: CONFIDENCIALIDADE.CONFIDENCIAL, label: 'Confidencial' },
];

const ACCESS_MODE_OPTIONS = [
  {
    key: 'livre',
    label: 'Livre acesso',
    description: 'Qualquer visitante do portal pode baixar sem se identificar.',
    exigeCadastro: false,
  },
  {
    key: 'identificado',
    label: 'Acesso identificado',
    description: 'O visitante precisa se cadastrar antes de baixar.',
    exigeCadastro: true,
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfidentialitySection({ value, onChange, canManage, errors }: ConfidentialitySectionProps) {
  const { user } = useAuth();
  const { data: departamentos } = useDepartments();
  const { data: users } = useUsers();

  const currentUserId = user?.id ?? '';
  const currentUserOption = (users ?? []).find((u) => u.id === currentUserId);

  const departamentoOptions = (departamentos ?? []).map((d) => ({ value: d.id, label: d.nome }));
  // O usuário atual nunca aparece como opção selecionável aqui — ele é representado
  // pelo chip fixo "Você" abaixo, sempre incluído e não removível (ver onValuesChange).
  const userOptions = (users ?? [])
    .filter((u) => u.id !== currentUserId)
    .map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));

  const isPublico = value.confidencialidade === CONFIDENCIALIDADE.PUBLICO;
  const isRestrito = value.confidencialidade === CONFIDENCIALIDADE.RESTRITO;
  const isConfidencial = value.confidencialidade === CONFIDENCIALIDADE.CONFIDENCIAL;

  // Trocar de nível zera as liberações do nível anterior (departamentos/usuários) e as
  // flags exclusivas do Público — só um tipo de liberação fica ativo por vez, espelhando
  // a regra do backend (ApplyDocumentConfidentialityUseCase). Exceção: ao entrar em
  // CONFIDENCIAL, accessUserIds não fica vazio — já nasce com o usuário atual (o chip
  // "Você" é exibido como já concedido, então o valor precisa refletir isso de imediato,
  // sem depender de uma interação extra na MultiCombobox de usuários).
  function handleLevelChange(nextValue: string) {
    const next = nextValue as Confidencialidade;
    const staysPublico = next === CONFIDENCIALIDADE.PUBLICO;
    const entersConfidencial = next === CONFIDENCIALIDADE.CONFIDENCIAL;
    onChange({
      ...value,
      confidencialidade: next,
      accessDepartamentoIds: [],
      accessUserIds: entersConfidencial && currentUserId ? [currentUserId] : [],
      exigeCadastro: staysPublico ? value.exigeCadastro : false,
      destaque: staysPublico ? value.destaque : false,
    });
  }

  function handleUserIdsChange(otherIds: string[]) {
    onChange({
      ...value,
      accessUserIds: currentUserId ? [currentUserId, ...otherIds] : otherIds,
    });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          Confidencialidade <span className="text-rose-500 dark:text-rose-400">*</span>
          {!canManage && <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
        </label>
        <Combobox
          value={value.confidencialidade}
          onValueChange={handleLevelChange}
          options={LEVEL_OPTIONS}
          placeholder="Selecione a confidencialidade"
          disabled={!canManage}
          error={canManage && !!errors?.confidencialidade}
        />
        {canManage && errors?.confidencialidade && (
          <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.confidencialidade}</p>
        )}
        {!canManage && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-500">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Apenas administradores ou usuários com permissão podem definir outro nível.</span>
          </p>
        )}
      </div>

      {/* Um usuário sem a permissão DOCUMENTS_MANAGE_CONFIDENTIALITY nunca vê os
          controles de departamento/usuário abaixo — não só desabilitados, ausentes. */}
      {canManage && (
        <div className="animate-dropdown-in space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
          {isPublico && (
            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-sm text-slate-600 dark:text-slate-400">
                  Acesso ao documento no portal público
                </span>
                <div role="radiogroup" aria-label="Acesso ao documento no portal público" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ACCESS_MODE_OPTIONS.map((option) => {
                    const isSelected = value.exigeCadastro === option.exigeCadastro;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChange({ ...value, exigeCadastro: option.exigeCadastro })}
                        className={cn(
                          'flex flex-col items-start gap-0.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
                        )}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs opacity-80">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="confidentiality-destaque"
                  checked={value.destaque}
                  onChange={(e) => onChange({ ...value, destaque: e.target.checked })}
                />
                <label htmlFor="confidentiality-destaque" className="cursor-pointer text-sm text-slate-600 dark:text-slate-400">
                  Exibir no portal público como destaque
                </label>
              </div>
            </div>
          )}

          {isRestrito && (
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                Departamentos adicionais com acesso
              </label>
              <MultiCombobox
                values={value.accessDepartamentoIds}
                onValuesChange={(ids) => onChange({ ...value, accessDepartamentoIds: ids })}
                options={departamentoOptions}
                placeholder="Selecionar departamentos"
                searchPlaceholder="Buscar departamento…"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                O departamento do documento sempre tem acesso.
              </p>
            </div>
          )}

          {isConfidencial && (
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Usuários com acesso</label>
              {currentUserOption && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span
                    title="Você sempre tem acesso a documentos confidenciais que enviar"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"
                  >
                    <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Você ({currentUserOption.name})
                  </span>
                </div>
              )}
              <MultiCombobox
                values={value.accessUserIds.filter((id) => id !== currentUserId)}
                onValuesChange={handleUserIdsChange}
                options={userOptions}
                placeholder="Selecionar usuários"
                searchPlaceholder="Buscar usuário…"
                error={!!errors?.accessUserIds}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Você sempre tem acesso como responsável pelo envio.
              </p>
              {errors?.accessUserIds && <p className="text-xs text-rose-400 mt-1">{errors.accessUserIds}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
