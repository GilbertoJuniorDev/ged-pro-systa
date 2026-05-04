'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ROLE } from '@ged/types';
import { useCreateUser } from '../../hooks/use-create-user';

const createUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
    role: z.enum([ROLE.MANAGER, ROLE.VIEWER]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: ROLE.VIEWER },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    await mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
          Nome completo
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          placeholder="Ex: Ana Souza"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          placeholder="usuario@empresa.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          placeholder="Mínimo 8 caracteres"
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          placeholder="Repita a senha"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1.5">
          Função
        </label>
        <select
          id="role"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          {...register('role')}
        >
          <option value={ROLE.VIEWER}>Visualizador</option>
          <option value={ROLE.MANAGER}>Gerente</option>
        </select>
        {errors.role && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.role.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        {isPending ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  );
}
