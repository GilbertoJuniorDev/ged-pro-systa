'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { ROLE } from '@ged/types';
import type { UserDto } from '@/types';
import { useUpdateUser, useToggleUserActive } from '@/hooks/use-users';
import { UsuarioPermissoesContent } from '@/components/admin/usuario-permissoes/usuario-permissoes-modal';
import { PessoaFisicaForm } from '@/components/admin/pessoa-fisica/pessoa-fisica-form';
import { EnderecoList } from '@/components/admin/pessoa-fisica/endereco-list';
import { TelefoneList } from '@/components/admin/pessoa-fisica/telefone-list';
import { usePhysicalPerson } from '@/hooks/use-physical-person';
import { Combobox } from '@/components/ui/combobox';

const editSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.enum(['MANAGER', 'VIEWER']),
});

type EditFormData = z.infer<typeof editSchema>;

type TabId = 'dados' | 'permissoes' | 'pessoa-fisica';

interface TabButtonProps {
  id: TabId;
  label: string;
  active: boolean;
  onClick: (id: TabId) => void;
}

function TabButton({ id, label, active, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}

function DadosTab({ user }: { user: UserDto }) {
  const { data: session } = useSession();
  const updateUser = useUpdateUser();
  const toggleActive = useToggleUserActive();
  const isSelf = session?.user?.id === user.id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      role: user.role === 'ADMIN' ? 'MANAGER' : (user.role as 'MANAGER' | 'VIEWER'),
    },
  });

  function onSubmit(data: EditFormData) {
    updateUser.mutate({ id: user.id, payload: data });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nome</label>
          <input
            {...register('name')}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">E-mail</label>
          <input
            value={user.email}
            disabled
            className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
        </div>
        {user.role !== ROLE.ADMIN && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Função</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar função…"
                  options={[
                    { value: 'MANAGER', label: 'Gerente' },
                    { value: 'VIEWER', label: 'Visualizador' },
                  ]}
                />
              )}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={updateUser.isPending || isSelf}
          className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {updateUser.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>

      <div className="border-t border-slate-800 pt-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Status da conta</h4>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              user.isActive
                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-slate-700 text-slate-400 ring-1 ring-slate-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {user.isActive ? 'Ativo' : 'Inativo'}
          </span>
          <button
            onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
            disabled={isSelf || toggleActive.isPending}
            className={`text-sm px-4 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
              user.isActive
                ? 'border-amber-700 text-amber-400 hover:bg-amber-500/10'
                : 'border-emerald-700 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {user.isActive ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PessoaFisicaTab({ userId }: { userId: string }) {
  const { data: pessoaFisica, isLoading } = usePhysicalPerson(userId);

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-4">Dados Pessoais</h4>
        <PessoaFisicaForm userId={userId} existingData={pessoaFisica} />
      </div>

      {pessoaFisica && (
        <>
          <div className="border-t border-slate-800 pt-6">
            <EnderecoList userId={userId} />
          </div>
          <div className="border-t border-slate-800 pt-6">
            <TelefoneList userId={userId} />
          </div>
        </>
      )}

      {!pessoaFisica && (
        <p className="text-slate-500 text-sm">
          Preencha os dados pessoais acima para habilitar o cadastro de endereços e telefones.
        </p>
      )}
    </div>
  );
}

interface Props {
  user: UserDto;
}

export function UserDetailClient({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('dados');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton id="dados" label="Dados" active={activeTab === 'dados'} onClick={setActiveTab} />
        <TabButton id="permissoes" label="Permissões" active={activeTab === 'permissoes'} onClick={setActiveTab} />
        <TabButton id="pessoa-fisica" label="Pessoa Física" active={activeTab === 'pessoa-fisica'} onClick={setActiveTab} />
      </div>

      {/* Conteúdo */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
        {activeTab === 'dados' && <DadosTab user={user} />}
        {activeTab === 'permissoes' && (
          <UsuarioPermissoesContent userId={user.id} />
        )}
        {activeTab === 'pessoa-fisica' && <PessoaFisicaTab userId={user.id} />}
      </div>
    </div>
  );
}
