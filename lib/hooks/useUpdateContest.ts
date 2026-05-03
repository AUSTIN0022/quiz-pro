'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestService } from '@/lib/services/contest-service';
import { Contest } from '@/lib/types';
import { toast } from 'sonner';

export function useUpdateContest(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Contest>) => {
      // In a real app, this would call an API
      // For now, we simulate success
      await new Promise(resolve => setTimeout(resolve, 800));
      return updates;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest', contestId] });
      toast.success('Changes saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save changes');
    },
  });
}
