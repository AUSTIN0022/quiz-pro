import { useCallback, useEffect, useState, useRef } from 'react';
import type { QuizResult } from '@/lib/types';
import { submissionService } from '@/lib/services/submission-service';

export function useLeaderboard(contestId: string, refreshInterval: number = 5000) {
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timer | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await submissionService.getResults(contestId);

      if (response.success && response.data) {
        const sorted = response.data.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.rank - b.rank;
        });

        setLeaderboard(sorted);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh leaderboard
  useEffect(() => {
    if (refreshInterval <= 0) return;

    refreshTimerRef.current = setInterval(() => {
      fetchLeaderboard();
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchLeaderboard, refreshInterval]);

  const getTopN = useCallback((n: number = 10) => {
    return leaderboard.slice(0, n);
  }, [leaderboard]);

  const getPodium = useCallback(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const getScorePercentiles = useCallback(() => {
    if (leaderboard.length === 0) return {};

    const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
    const p25 = Math.floor(sorted.length * 0.25);
    const p50 = Math.floor(sorted.length * 0.50);
    const p75 = Math.floor(sorted.length * 0.75);

    return {
      p25: sorted[p25]?.score || 0,
      p50: sorted[p50]?.score || 0,
      p75: sorted[p75]?.score || 0
    };
  }, [leaderboard]);

  const getParticipantRank = useCallback(
    (participantId: string) => {
      const entry = leaderboard.find(e => e.participantId === participantId);
      return entry?.rank ?? null;
    },
    [leaderboard]
  );

  const getParticipantScore = useCallback(
    (participantId: string) => {
      const entry = leaderboard.find(e => e.participantId === participantId);
      return entry?.score ?? null;
    },
    [leaderboard]
  );

  return {
    leaderboard,
    loading,
    error,
    lastUpdated,
    getTopN,
    getPodium,
    getScorePercentiles,
    getParticipantRank,
    getParticipantScore,
    refetch: fetchLeaderboard
  };
}
