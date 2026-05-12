'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../lib/api-client';
import type {
  RecordPaymentInput,
  SubscriptionDto,
  SubscriptionPaymentDto,
  UpsertSubscriptionInput,
} from '../types';

export function useSubscription() {
  const { data: session } = useSession();

  return useQuery<SubscriptionDto | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        return await apiClient.get<SubscriptionDto>('/subscription', {
          token: session?.user?.accessToken,
        });
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return null;
        throw err;
      }
    },
    enabled: !!session?.user?.accessToken,
  });
}

export function useUpsertSubscription() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertSubscriptionInput) =>
      apiClient.put<SubscriptionDto>('/subscription', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Assinatura salva com sucesso!');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao salvar assinatura';
      toast.error(message);
    },
  });
}

function makeActionHook(
  path: 'suspend' | 'reactivate' | 'cancel',
  successMsg: string,
) {
  return function useAction() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () =>
        apiClient.post<SubscriptionDto>(`/subscription/${path}`, undefined, {
          token: session?.user?.accessToken,
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['subscription'] });
        toast.success(successMsg);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Erro';
        toast.error(message);
      },
    });
  };
}

export const useSuspendSubscription = makeActionHook(
  'suspend',
  'Assinatura suspensa.',
);
export const useReactivateSubscription = makeActionHook(
  'reactivate',
  'Assinatura reativada.',
);
export const useCancelSubscription = makeActionHook(
  'cancel',
  'Assinatura cancelada.',
);

export function useRecordPayment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecordPaymentInput) =>
      apiClient.post<SubscriptionDto>('/subscription/record-payment', payload, {
        token: session?.user?.accessToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
      void queryClient.invalidateQueries({ queryKey: ['subscription', 'payments'] });
      toast.success('Pagamento registrado.');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pagamento';
      toast.error(message);
    },
  });
}

export function useSubscriptionPayments() {
  const { data: session } = useSession();

  return useQuery<SubscriptionPaymentDto[]>({
    queryKey: ['subscription', 'payments'],
    queryFn: () =>
      apiClient.get<SubscriptionPaymentDto[]>('/subscription/payments', {
        token: session?.user?.accessToken,
      }),
    enabled: !!session?.user?.accessToken,
  });
}
