'use client';

import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { useDepartments } from './use-departments';
import { isFullAccessRole } from './use-permissions';
import type { ComboboxOption } from '@/components/ui/combobox';

// Departamento filter shared by every explorer panel: admins pick freely among all
// departamentos, non-admins are locked to their own (auto-selected on mount).
export function useDepartmentFilter(value: string, setValue: (departamentoId: string) => void) {
  const { user } = useAuth();
  const isAdmin = isFullAccessRole(user?.role);
  const { data: departamentos } = useDepartments(isAdmin);

  useEffect(() => {
    if (!isAdmin && user?.selectedDepartmentId && value !== user.selectedDepartmentId) {
      setValue(user.selectedDepartmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.selectedDepartmentId]);

  const options: ComboboxOption[] = isAdmin
    ? [
        { value: '', label: 'Todos os departamentos' },
        ...(departamentos?.map((d) => ({ value: d.id, label: d.nome })) ?? []),
      ]
    : (user?.departamentos ?? [])
        .filter((d) => d.id === user?.selectedDepartmentId)
        .map((d) => ({ value: d.id, label: d.nome }));

  function nomeById(departamentoId: string): string {
    return (departamentos ?? user?.departamentos)?.find((d) => d.id === departamentoId)?.nome ?? '—';
  }

  return { isAdmin, departamentos, options, nomeById };
}
