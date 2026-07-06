'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { ROLE } from '@ged/types';
import { useCreateUser } from '../../hooks/use-create-user';
import { useModules } from '../../hooks/use-modules';
import { usePermissionsManagement } from '../../hooks/use-permission-management';
import { useDepartments } from '../../hooks/use-departments';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { PasswordStrengthBar, PasswordStrengthCriteria } from '@/components/ui/password-strength';
import { ROLE_LABELS } from '@/lib/role-labels';

const pessoaFisicaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter ao menos 2 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter exatamente 11 dígitos numéricos'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['M', 'F', 'O'], { required_error: 'Selecione o sexo' }),
});

const createUserSchema = z
  .object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
    role: z.enum([ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER]),
    pessoaFisica: pessoaFisicaSchema,
    permissaoIds: z.array(z.string().uuid()),
    departamentoIds: z.array(z.string().uuid()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const { mutateAsync, isPending } = useCreateUser();
  const { data: modulosRaw } = useModules();
  const { data: permissoesRaw } = usePermissionsManagement();
  const { data: departamentosRaw } = useDepartments();

  const actingRole = session?.user?.role;

  const assignableRoles = useMemo(
    () =>
      actingRole === ROLE.SUPER_ADMIN
        ? [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER]
        : [ROLE.MANAGER, ROLE.VIEWER],
    [actingRole],
  );

  const modulos = useMemo(
    () => (modulosRaw ?? []).filter((m) => m.isActive).sort((a, b) => a.ordem - b.ordem),
    [modulosRaw],
  );

  const permissoesPorModulo = useMemo(() => {
    const permissoes = permissoesRaw ?? [];
    const map = new Map<string | null, typeof permissoes>();
    for (const p of permissoes) {
      const key = p.moduloId ?? null;
      const existing = map.get(key) ?? [];
      existing.push(p);
      map.set(key, existing);
    }
    return map;
  }, [permissoesRaw]);

  const departamentos = useMemo(
    () => (departamentosRaw ?? []).filter((d) => d.isActive).sort((a, b) => a.nome.localeCompare(b.nome)),
    [departamentosRaw],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: ROLE.VIEWER, permissaoIds: [], departamentoIds: [] },
  });

  const selectedIds = watch('permissaoIds') ?? [];

  const toggleAll = (permissaoIds: string[], checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedIds, ...permissaoIds]));
      setValue('permissaoIds', merged, { shouldDirty: true });
    } else {
      setValue(
        'permissaoIds',
        selectedIds.filter((id) => !permissaoIds.includes(id)),
        { shouldDirty: true },
      );
    }
  };

  const onSubmit = async (data: CreateUserFormData) => {
    await mutateAsync({
      name: `${data.pessoaFisica.nome} ${data.pessoaFisica.sobrenome}`,
      email: data.email,
      password: data.password,
      role: data.role,
      pessoaFisica: data.pessoaFisica,
      permissaoIds: data.permissaoIds && data.permissaoIds.length > 0 ? data.permissaoIds : undefined,
      departamentoIds:
        data.departamentoIds && data.departamentoIds.length > 0 ? data.departamentoIds : undefined,
    });
    reset();
    router.push('/admin/users');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* Grid 2 colunas: Dados Pessoais | Dados de Acesso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">

        {/* Coluna esquerda — Dados Pessoais */}
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dados Pessoais</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-nome" className="block text-sm font-medium text-slate-300 mb-1.5">
                Nome
              </label>
              <input
                id="pf-nome"
                type="text"
                autoComplete="given-name"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="Ex: Ana"
                {...register('pessoaFisica.nome')}
              />
              {errors.pessoaFisica?.nome && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.pessoaFisica.nome.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-sobrenome" className="block text-sm font-medium text-slate-300 mb-1.5">
                Sobrenome
              </label>
              <input
                id="pf-sobrenome"
                type="text"
                autoComplete="family-name"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="Ex: Souza"
                {...register('pessoaFisica.sobrenome')}
              />
              {errors.pessoaFisica?.sobrenome && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.pessoaFisica.sobrenome.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pf-cpf" className="block text-sm font-medium text-slate-300 mb-1.5">
              CPF <span className="text-slate-500 font-normal">(somente números)</span>
            </label>
            <input
              id="pf-cpf"
              type="text"
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="00000000000"
              {...register('pessoaFisica.cpf')}
            />
            {errors.pessoaFisica?.cpf && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.pessoaFisica.cpf.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-dataNascimento" className="block text-sm font-medium text-slate-300 mb-1.5">
                Data de nascimento
              </label>
              <Controller
                name="pessoaFisica.dataNascimento"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="DD/MM/AAAA"
                    error={!!errors.pessoaFisica?.dataNascimento}
                  />
                )}
              />
              {errors.pessoaFisica?.dataNascimento && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.pessoaFisica.dataNascimento.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-sexo" className="block text-sm font-medium text-slate-300 mb-1.5">
                Sexo
              </label>
              <Controller
                name="pessoaFisica.sexo"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecionar…"
                    error={!!errors.pessoaFisica?.sexo}
                    options={[
                      { value: 'M', label: 'Masculino' },
                      { value: 'F', label: 'Feminino' },
                      { value: 'O', label: 'Outro' },
                    ]}
                  />
                )}
              />
              {errors.pessoaFisica?.sexo && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.pessoaFisica.sexo.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita — Dados de Acesso */}
        <div className="space-y-5 mt-6 lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dados de Acesso</p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="usuario@empresa.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Senha
            </label>
            <PasswordStrengthBar password={watch('password') ?? ''} />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="Mínimo 8 caracteres"
              {...register('password')}
            />
            <PasswordStrengthCriteria password={watch('password') ?? ''} />
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
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
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
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar função…"
                  error={!!errors.role}
                  options={assignableRoles.map((role) => ({ value: role, label: ROLE_LABELS[role] ?? role }))}
                />
              )}
            />
            {errors.role && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.role.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Permissões de Acesso */}
      <div className="pt-1">
        <hr className="border-slate-700 mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Permissões de Acesso <span className="text-slate-600 font-normal normal-case">(opcional)</span>
        </p>
      </div>

      <Controller
        control={control}
        name="permissaoIds"
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {modulos.map((modulo) => {
              const permissoes = permissoesPorModulo.get(modulo.id) ?? [];
              const moduloIds = permissoes.map((p) => p.id);
              const allChecked =
                moduloIds.length > 0 && moduloIds.every((id) => (field.value ?? []).includes(id));
              const someChecked = moduloIds.some((id) => (field.value ?? []).includes(id));

              return (
                <div
                  key={modulo.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                    {modulo.icone && (
                      <span className="text-base leading-none">{modulo.icone}</span>
                    )}
                    <span className="text-sm font-medium text-slate-200 flex-1">{modulo.nome}</span>
                    {moduloIds.length > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={(e) => toggleAll(moduloIds, e.target.checked)}
                        />
                        <span className="text-xs text-slate-400">Todos</span>
                      </label>
                    )}
                  </div>

                  <div className="px-4 py-3">
                    {permissoes.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhuma permissão cadastrada neste módulo.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {permissoes.map((permissao) => {
                          const isChecked = (field.value ?? []).includes(permissao.id);
                          return (
                            <label
                              key={permissao.id}
                              className="flex items-start gap-3 cursor-pointer group"
                            >
                              <Checkbox
                                className="mt-0.5"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = field.value ?? [];
                                  if (e.target.checked) {
                                    field.onChange([...current, permissao.id]);
                                  } else {
                                    field.onChange(current.filter((id) => id !== permissao.id));
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-tight block">
                                  {permissao.nome}
                                </span>
                                {permissao.descricao && (
                                  <span className="text-xs text-slate-500 leading-tight block mt-0.5">
                                    {permissao.descricao}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Permissões sem módulo */}
            {(permissoesPorModulo.get(null) ?? []).length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <span className="text-sm font-medium text-slate-400 flex-1 italic">Sem módulo</span>
                  {(() => {
                    const semModuloIds = (permissoesPorModulo.get(null) ?? []).map((p) => p.id);
                    const allCheckedSm = semModuloIds.every((id) => (field.value ?? []).includes(id));
                    const someCheckedSm = semModuloIds.some((id) => (field.value ?? []).includes(id));
                    return (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={allCheckedSm}
                          indeterminate={someCheckedSm && !allCheckedSm}
                          onChange={(e) => toggleAll(semModuloIds, e.target.checked)}
                        />
                        <span className="text-xs text-slate-400">Todos</span>
                      </label>
                    );
                  })()}
                </div>
                <div className="px-4 py-3 grid grid-cols-1 gap-2">
                  {(permissoesPorModulo.get(null) ?? []).map((permissao) => {
                    const isChecked = (field.value ?? []).includes(permissao.id);
                    return (
                      <label
                        key={permissao.id}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = field.value ?? [];
                            if (e.target.checked) {
                              field.onChange([...current, permissao.id]);
                            } else {
                              field.onChange(current.filter((id) => id !== permissao.id));
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-tight block">
                            {permissao.nome}
                          </span>
                          {permissao.descricao && (
                            <span className="text-xs text-slate-500 leading-tight block mt-0.5">
                              {permissao.descricao}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {modulos.length === 0 && (permissoesRaw ?? []).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-2 col-span-full">
                Nenhum módulo ou permissão cadastrado.
              </p>
            )}
          </div>
        )}
      />

      {/* Departamentos */}
      <div className="pt-1">
        <hr className="border-slate-700 mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Departamentos <span className="text-slate-600 font-normal normal-case">(opcional)</span>
        </p>
      </div>

      <Controller
        control={control}
        name="departamentoIds"
        render={({ field }) => (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
            {departamentos.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                Nenhum departamento cadastrado.
              </p>
            ) : (
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {departamentos.map((departamento) => {
                  const isChecked = (field.value ?? []).includes(departamento.id);
                  return (
                    <label
                      key={departamento.id}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = field.value ?? [];
                          if (e.target.checked) {
                            field.onChange([...current, departamento.id]);
                          } else {
                            field.onChange(current.filter((id) => id !== departamento.id));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-tight">
                        {departamento.nome}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {isPending ? 'Criando…' : 'Criar Usuário'}
      </button>
    </form>
  );
}