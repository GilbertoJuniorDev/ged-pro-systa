'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { detectarTipoDocumento, formatDocumento } from '@ged/utils';
import { cn } from '@/lib/utils';
import type { CadastroDownloadFormData } from './cadastro-download-schema';

interface CadastroDownloadFieldsProps {
  readonly register: UseFormRegister<CadastroDownloadFormData>;
  readonly control: Control<CadastroDownloadFormData>;
  readonly errors: FieldErrors<CadastroDownloadFormData>;
}

function fieldClass(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
    hasError ? 'border-rose-400' : 'border-slate-300',
  );
}

// Campos nome/e-mail/documento do CadastroDownloadModal. O campo `documento` é controlado
// (Controller) porque exige máscara dinâmica: guarda dígitos crus no form state e formata
// com formatDocumento assim que detectarTipoDocumento reconhece 11 (CPF) ou 14 (CNPJ)
// dígitos — antes disso mostra os dígitos crus, já que o tipo ainda é ambíguo.
export function CadastroDownloadFields({ register, control, errors }: CadastroDownloadFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="cadastro-nome" className="mb-1 block text-sm text-slate-600">
          Nome completo <span className="text-rose-600">*</span>
        </label>
        <input
          id="cadastro-nome"
          {...register('nome')}
          autoFocus
          placeholder="Seu nome completo"
          className={fieldClass(!!errors.nome)}
        />
        {errors.nome && <p className="mt-1 text-xs text-rose-600">{errors.nome.message}</p>}
      </div>

      <div>
        <label htmlFor="cadastro-email" className="mb-1 block text-sm text-slate-600">
          E-mail <span className="text-rose-600">*</span>
        </label>
        <input
          id="cadastro-email"
          type="email"
          {...register('email')}
          placeholder="voce@email.com"
          className={fieldClass(!!errors.email)}
        />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="cadastro-documento" className="mb-1 block text-sm text-slate-600">
          CPF ou CNPJ <span className="text-rose-600">*</span>
        </label>
        <Controller
          name="documento"
          control={control}
          render={({ field }) => {
            const tipo = detectarTipoDocumento(field.value);
            return (
              <input
                id="cadastro-documento"
                type="text"
                inputMode="numeric"
                value={tipo ? formatDocumento(field.value, tipo) : field.value}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder="Informe o CPF ou CNPJ"
                className={fieldClass(!!errors.documento)}
              />
            );
          }}
        />
        {errors.documento && <p className="mt-1 text-xs text-rose-600">{errors.documento.message}</p>}
      </div>
    </>
  );
}
