import { useCallback, useEffect, useState } from 'react';
import { submissionService } from '@/lib/services/submission-service';
import type { QuizResult } from '@/lib/types';

export interface ResultsState {
  results: QuizResult[];
  loading: boolean;
  error: string | null;
  published: boolean;
  evaluated: boolean;
  evaluatedCount: number;
}

export function useResults(contestId: string) {
  const [state, setState] = useState<ResultsState>({
    results: [],
    loading: true,
    error: null,
    published: false,
    evaluated: false,
    evaluatedCount: 0
  });

  const fetchResults = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await submissionService.getResults(contestId);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          results: response.data || [],
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch results'
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [contestId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const publishResults = useCallback(async () => {
    try {
      const response = await submissionService.publishResults(contestId);
      if (response.success) {
        setState(prev => ({ ...prev, published: true }));
      }
      return response;
    } catch (err) {
      console.error('[v0] Publish failed:', err);
      throw err;
    }
  }, [contestId]);

  const evaluateAnswers = useCallback(
    async (questions: any[]) => {
      try {
        const response = await submissionService.evaluateAnswers(contestId, questions);
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            evaluated: true,
            evaluatedCount: response.data.evaluated
          }));
        }
        return response;
      } catch (err) {
        console.error('[v0] Evaluation failed:', err);
        throw err;
      }
    },
    [contestId]
  );

  const getLeaderboard = useCallback(() => {
    return state.results.sort((a, b) => a.rank - b.rank).slice(0, 10);
  }, [state.results]);

  const getScoreDistribution = useCallback(() => {
    const distribution: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    state.results.forEach(result => {
      const score = result.score;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return distribution;
  }, [state.results]);

  return {
    ...state,
    fetchResults,
    publishResults,
    evaluateAnswers,
    getLeaderboard,
    getScoreDistribution
  };
}
