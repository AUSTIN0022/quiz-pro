import { useCallback, useEffect, useState } from 'react';
import { contestService } from '@/lib/services/contest-service';
import type { Contest } from '@/lib/types';

export interface ContestStats {
  totalRegistered: number;
  paidRegistrations: number;
  freeRegistrations: number;
  pendingPayments: number;
  confirmedRegistrations: number;
  cancelledRegistrations: number;
  totalSubmissions: number;
  avgScore: number;
  avgTimeSpent: number;
}

export function useContest(contestId: string) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [stats, setStats] = useState<ContestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contestService.getContestById(contestId);

      if (response.success && response.data) {
        setContest(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch contest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  const fetchStats = useCallback(async () => {
    try {
      // This would call a stats endpoint if available
      // For now, return mock stats
      setStats({
        totalRegistered: Math.floor(Math.random() * 500) + 50,
        paidRegistrations: Math.floor(Math.random() * 300) + 20,
        freeRegistrations: Math.floor(Math.random() * 200) + 10,
        pendingPayments: Math.floor(Math.random() * 50),
        confirmedRegistrations: Math.floor(Math.random() * 300) + 50,
        cancelledRegistrations: Math.floor(Math.random() * 20),
        totalSubmissions: Math.floor(Math.random() * 200) + 20,
        avgScore: Math.floor(Math.random() * 100),
        avgTimeSpent: Math.floor(Math.random() * 3600)
      });
    } catch (err) {
      console.error('[v0] Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchContest();
    fetchStats();
  }, [fetchContest, fetchStats]);

  const isRegistrationOpen = useCallback(() => {
    if (!contest) return false;

    const now = new Date();
    const startDate = new Date(contest.registrationStartDate);
    const endDate = new Date(contest.registrationEndDate);

    return now >= startDate && now <= endDate;
  }, [contest]);

  const isContestActive = useCallback(() => {
    if (!contest) return false;

    const now = new Date();
    const contestDate = new Date(contest.contestDate);
    const startTime = new Date(`${contest.contestDate}T${contest.contestStartTime}`);
    const endTime = new Date(`${contest.contestDate}T${contest.contestEndTime}`);

    return now >= startTime && now <= endTime;
  }, [contest]);

  const getTimeRemaining = useCallback(() => {
    if (!contest) return null;

    if (isContestActive()) {
      const endTime = new Date(`${contest.contestDate}T${contest.contestEndTime}`);
      const now = new Date();
      return Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
    }

    return null;
  }, [contest, isContestActive]);

  return {
    contest,
    stats,
    loading,
    error,
    fetchContest,
    fetchStats,
    isRegistrationOpen,
    isContestActive,
    getTimeRemaining
  };
}
