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
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Dados da Empresa</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Configure os dados da pessoa jurídica proprietária desta instância do GED Pro.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Dados cadastrais</h3>

            {!data && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
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
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Data de Abertura</span>
                <DatePicker value={form.dataAbertura || undefined} onChange={(v) => update('dataAbertura', v)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Porte</span>
                <Combobox value={form.porte || undefined} onValueChange={(v) => update('porte', v)} options={PORTE_OPTIONS} placeholder="Selecionar porte" />
              </div>
              <Field label="Natureza Jurídica (código)">
                <input value={form.naturezaJuridicaCodigo} onChange={(e) => update('naturezaJuridicaCodigo', e.target.value)} placeholder="2062" className={inputCls} />
              </Field>
              <Field label="Natureza Jurídica (descrição)" className="md:col-span-2">
                <input value={form.naturezaJuridicaDescricao} onChange={(e) => update('naturezaJuridicaDescricao', e.target.value)} placeholder="Sociedade Empresária Limitada" className={inputCls} />
              </Field>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Situação Cadastral</span>
                <Combobox value={form.situacaoCadastral || undefined} onValueChange={(v) => update('situacaoCadastral', v)} options={SITUACAO_OPTIONS} placeholder="Selecionar situação" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Data da Situação</span>
                <DatePicker value={form.situacaoCadastralData || undefined} onChange={(v) => update('situacaoCadastralData', v)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mt-7">
                <Checkbox checked={form.matriz} onChange={(e) => update('matriz', (e.target as HTMLInputElement).checked)} />
                É matriz
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={upsert.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
              >
                {upsert.isPending ? 'Salvando...' : data ? 'Salvar alterações' : 'Cadastrar empresa'}
              </button>
            </div>
          </form>

          {data && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <CompanyAddressList />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <CompanyPhoneList />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <CompanyEmailList />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

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
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
