'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCpf, stripCpfMask } from '@ged/utils';
import type { PhysicalPersonDto } from '@/types';
import { useCreatePhysicalPerson, useUpdatePhysicalPerson } from '@/hooks/use-physical-person';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  sobrenome: z.string().min(2, 'Mínimo 2 caracteres'),
  cpf: z
    .string()
    .refine((v) => stripCpfMask(v).length === 11, 'CPF deve ter 11 dígitos'),
  dataNascimento: z.string().min(1, 'Obrigatório'),
  sexo: z.enum(['M', 'F', 'O'], { required_error: 'Obrigatório' }),
});

type FormData = z.infer<typeof schema>;

interface Props {
  userId: string;
  existingData?: PhysicalPersonDto;
}

export function PessoaFisicaForm({ userId, existingData }: Props) {
  const create = useCreatePhysicalPerson(userId);
  const update = useUpdatePhysicalPerson(userId);
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      sobrenome: '',
      cpf: '',
      dataNascimento: '',
    },
  });

  useEffect(() => {
    if (existingData) {
      reset({
        nome: existingData.nome,
        sobrenome: existingData.sobrenome,
        cpf: formatCpf(existingData.cpf),
        dataNascimento: existingData.dataNascimento.slice(0, 10),
        sexo: existingData.sexo,
      });
    }
  }, [existingData, reset]);

  function onSubmit(data: FormData) {
    const payload = { ...data, cpf: stripCpfMask(data.cpf) };
    if (existingData) {
      update.mutate(payload);
    } else {
      create.mutate(payload);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nome <span className="text-rose-400">*</span></label>
          <input
            {...register('nome')}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.nome && <p className="text-rose-400 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Sobrenome <span className="text-rose-400">*</span></label>
          <input
            {...register('sobrenome')}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.sobrenome && <p className="text-rose-400 text-xs mt-1">{errors.sobrenome.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">CPF <span className="text-rose-400">*</span></label>
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                placeholder="000.000.000-00"
                maxLength={14}
                onChange={(e) => field.onChange(formatCpf(e.target.value))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          />
          {errors.cpf && <p className="text-rose-400 text-xs mt-1">{errors.cpf.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Data de Nascimento <span className="text-rose-400">*</span></label>
          <Controller
            name="dataNascimento"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="DD/MM/AAAA"
                error={!!errors.dataNascimento}
              />
            )}
          />
          {errors.dataNascimento && <p className="text-rose-400 text-xs mt-1">{errors.dataNascimento.message}</p>}
        </div>
      </div>

      <div className="w-full sm:w-1/2">
        <label className="block text-sm text-slate-400 mb-1">Sexo <span className="text-rose-400">*</span></label>
        <Controller
          name="sexo"
          control={control}
          render={({ field }) => (
            <Combobox
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Selecionar…"
              error={!!errors.sexo}
              options={[
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Feminino' },
                { value: 'O', label: 'Outro' },
              ]}
            />
          )}
        />
        {errors.sexo && <p className="text-rose-400 text-xs mt-1">{errors.sexo.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : existingData ? 'Atualizar' : 'Criar perfil'}
        </button>
      </div>
    </form>
  );
}
