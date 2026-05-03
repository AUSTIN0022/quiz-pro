'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationService } from '@/lib/services/registration-service';
import { Registration } from '@/lib/types';
import { toast } from 'sonner';

export function useRegistrations(contestId: string, filters?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-registrations', contestId, filters],
    queryFn: async () => {
      const response = await registrationService.getRegistrations(contestId, filters);
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
    staleTime: 60 * 1000,
  });

  const revokeMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason: string }) => 
      registrationService.bulkRevokeRegistrations(ids, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations', contestId] });
      toast.success('Registrations revoked');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) => 
      registrationService.markAsPaid(id, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations', contestId] });
      toast.success('Marked as paid');
    },
  });

  const allowFreeEntryMutation = useMutation({
    mutationFn: (id: string) => registrationService.allowFreeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations', contestId] });
      toast.success('Free entry allowed');
    },
  });

  return {
    ...query,
    revokeRegistrations: revokeMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    allowFreeEntry: allowFreeEntryMutation.mutateAsync,
    isMutating: revokeMutation.isPending || markAsPaidMutation.isPending || allowFreeEntryMutation.isPending
  };
}
