'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useCompany, useUpsertCompany } from '@/hooks/use-company';
import { CompanyAddressList } from './company-address-list';
import { CompanyPhoneList } from './company-phone-list';
import { CompanyEmailList } from './company-email-list';
import { CompanyCnaeList } from './company-cnae-list';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';

interface FormState {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  nomeEmpresarial: string;
  inscricaoEstadual: string;
  matriz: boolean;
  dataAbertura: string;
  porte: string;
  naturezaJuridicaCodigo: string;
  naturezaJuridicaDescricao: string;
  situacaoCadastral: string;
  situacaoCadastralData: string;
}

const EMPTY: FormState = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  nomeEmpresarial: '',
  inscricaoEstadual: '',
  matriz: true,
  dataAbertura: '',
  porte: '',
  naturezaJuridicaCodigo: '',
  naturezaJuridicaDescricao: '',
  situacaoCadastral: '',
  situacaoCadastralData: '',
};

const PORTE_OPTIONS = [
  { value: 'ME', label: 'ME' },
  { value: 'EPP', label: 'EPP' },
  { value: 'DEMAIS', label: 'Demais' },
] as const;

const SITUACAO_OPTIONS = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'INAPTA', label: 'Inapta' },
  { value: 'BAIXADA', label: 'Baixada' },
  { value: 'NULA', label: 'Nula' },
] as const;

export function CompanyPageClient() {
  const { data, isLoading } = useCompany();
  const upsert = useUpsertCompany();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (data) {
      setForm({
        cnpj: data.cnpj,
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia ?? '',
        nomeEmpresarial: data.nomeEmpresarial ?? '',
        inscricaoEstadual: data.inscricaoEstadual ?? '',
        matriz: data.matriz,
        dataAbertura: data.dataAbertura ?? '',
        porte: data.porte ?? '',
        naturezaJuridicaCodigo: data.naturezaJuridicaCodigo ?? '',
        naturezaJuridicaDescricao: data.naturezaJuridicaDescricao ?? '',
        situacaoCadastral: data.situacaoCadastral ?? '',
        situacaoCadastralData: data.situacaoCadastralData ?? '',
      });
    }
  }, [data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({
      cnpj: onlyDigits(form.cnpj),
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia || null,
      nomeEmpresarial: form.nomeEmpresarial || null,
      inscricaoEstadual: form.inscricaoEstadual || null,
      matriz: form.matriz,
      dataAbertura: form.dataAbertura || null,
      porte: form.porte || null,
      naturezaJuridicaCodigo: form.naturezaJuridicaCodigo || null,
      naturezaJuridicaDescricao: form.naturezaJuridicaDescricao || null,
      situacaoCadastral: form.situacaoCadastral || null,
      situacaoCadastralData: form.situacaoCadastralData || null,
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Dados da Empresa</h2>
        <p className="text-muted-foreground">
          Configure os dados da pessoa jurídica proprietária desta instância do GED Pro.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <h3 className="text-base font-semibold text-foreground mb-4">Dados cadastrais</h3>

            {!data && (
              <div className="mb-6 rounded-lg border border-warning/30 px-4 py-3 text-sm text-warning">
                Nenhum registro encontrado. Preencha os dados abaixo para concluir o cadastro inicial.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="CNPJ *">
                <input required inputMode="numeric" maxLength={18} value={form.cnpj} onChange={(e) => update('cnpj', e.target.value)} className={inputCls} placeholder="00.000.000/0000-00" />
              </Field>
              <Field label="Razão Social *" className="md:col-span-2">
                <input required value={form.razaoSocial} onChange={(e) => update('razaoSocial', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nome Fantasia">
                <input value={form.nomeFantasia} onChange={(e) => update('nomeFantasia', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nome Empresarial" className="md:col-span-2">
                <input value={form.nomeEmpresarial} onChange={(e) => update('nomeEmpresarial', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Inscrição Estadual">
                <input value={form.inscricaoEstadual} onChange={(e) => update('inscricaoEstadual', e.target.value)} className={inputCls} />
              </Field>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Data de Abertura</span>
                <DatePicker value={form.dataAbertura || undefined} onChange={(v) => update('dataAbertura', v)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Porte</span>
                <Combobox value={form.porte || undefined} onValueChange={(v) => update('porte', v)} options={PORTE_OPTIONS} placeholder="Selecionar porte" />
              </div>
              <Field label="Natureza Jurídica (código)">
                <input value={form.naturezaJuridicaCodigo} onChange={(e) => update('naturezaJuridicaCodigo', e.target.value)} placeholder="2062" className={inputCls} />
              </Field>
              <Field label="Natureza Jurídica (descrição)" className="md:col-span-2">
                <input value={form.naturezaJuridicaDescricao} onChange={(e) => update('naturezaJuridicaDescricao', e.target.value)} placeholder="Sociedade Empresária Limitada" className={inputCls} />
              </Field>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Situação Cadastral</span>
                <Combobox value={form.situacaoCadastral || undefined} onValueChange={(v) => update('situacaoCadastral', v)} options={SITUACAO_OPTIONS} placeholder="Selecionar situação" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Data da Situação</span>
                <DatePicker value={form.situacaoCadastralData || undefined} onChange={(v) => update('situacaoCadastralData', v)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground mt-7">
                <Checkbox checked={form.matriz} onChange={(e) => update('matriz', (e.target as HTMLInputElement).checked)} />
                É matriz
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={upsert.isPending}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {upsert.isPending ? 'Salvando...' : data ? 'Salvar alterações' : 'Cadastrar empresa'}
              </button>
            </div>
          </form>

          {data && (
            <>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <CompanyAddressList />
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <CompanyPhoneList />
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <CompanyEmailList />
              </div>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <CompanyCnaeList />
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30';

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
