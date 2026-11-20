'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { ROLE_LABELS } from '@/lib/role-labels';

const editSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.enum(['VIEWER']).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

type TabId = 'pessoa-fisica' | 'permissoes' | 'credenciais';

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
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
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
  const canEditRole = user.role === ROLE.VIEWER;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      role: canEditRole ? 'VIEWER' : undefined,
    },
  });

  function onSubmit(data: EditFormData) {
    updateUser.mutate({
      id: user.id,
      payload: {
        name: data.name,
        ...(canEditRole ? { role: data.role } : {}),
      },
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Nome</label>
          <input
            {...register('name')}
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">E-mail</label>
          <input
            value={user.email}
            disabled
            className="w-full rounded-lg bg-foreground/5 border border-border px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>
        {canEditRole && (
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Função</label>
            <div className="w-full rounded-lg bg-foreground/5 border border-border px-3 py-2 text-sm text-muted-foreground">
              {ROLE_LABELS.VIEWER}
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={updateUser.isPending || isSelf}
          className="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
        >
          {updateUser.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Status da conta</h4>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              user.isActive
                ? 'text-success ring-1 ring-success/40'
                : 'bg-foreground/10 text-muted-foreground ring-1 ring-border'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-foreground/10'}`} />
            {user.isActive ? 'Ativo' : 'Inativo'}
          </span>
          <button
            onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
            disabled={isSelf || toggleActive.isPending}
            className={`text-sm px-4 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
              user.isActive
                ? 'border-warning/30 text-warning hover:bg-warning/20'
                : 'border-success/30 text-success hover:bg-success/20'
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
    return <div className="h-40 rounded-xl bg-border animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">Dados Pessoais</h4>
        <PessoaFisicaForm userId={userId} existingData={pessoaFisica} />
      </div>

      {pessoaFisica && (
        <>
          <div className="border-t border-border pt-6">
            <EnderecoList userId={userId} />
          </div>
          <div className="border-t border-border pt-6">
            <TelefoneList userId={userId} />
          </div>
        </>
      )}

      {!pessoaFisica && (
        <p className="text-muted-foreground text-sm">
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
  const [activeTab, setActiveTab] = useState<TabId>('pessoa-fisica');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton id="pessoa-fisica" label="Pessoa Física (Dados)" active={activeTab === 'pessoa-fisica'} onClick={setActiveTab} />
        <TabButton id="permissoes" label="Permissões" active={activeTab === 'permissoes'} onClick={setActiveTab} />
        <TabButton id="credenciais" label="Credenciais" active={activeTab === 'credenciais'} onClick={setActiveTab} />
      </div>

      {/* Conteúdo */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        {activeTab === 'pessoa-fisica' && <PessoaFisicaTab userId={user.id} />}
        {activeTab === 'permissoes' && (
          <UsuarioPermissoesContent userId={user.id} />
        )}
        {activeTab === 'credenciais' && <DadosTab user={user} />}
      </div>
    </div>
  );
}
