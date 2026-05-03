import { useQuery } from '@tanstack/react-query';
import { contestService } from '@/lib/services/contest-service';
import { Contest } from '@/lib/types';

export function useContestDetail(contestId: string) {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: async () => {
      const response = await contestService.getContestById(contestId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch contest');
      }
      return response.data as Contest;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    enabled: !!contestId,
  });
}
