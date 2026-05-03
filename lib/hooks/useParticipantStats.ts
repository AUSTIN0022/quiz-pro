import { useState, useEffect } from 'react';
import { QuizResult } from '@/lib/types';
import { quizService } from '@/lib/services/quiz-service';

interface ParticipantStats {
  totalContests: number;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  passRate: number;
  totalMarksEarned: number;
  averageRank: number;
}

export function useParticipantStats(participantId: string) {
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, use empty results - in a real app this would call the API
        const results: any[] = [];
        
        if (results.length === 0) {
          setStats({
            totalContests: 0,
            totalAttempts: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
            passRate: 0,
            totalMarksEarned: 0,
            averageRank: 0,
          });
          return;
        }

        const attempts = results.length;
        const passed = results.filter((r: any) => r.isPassed).length;
        const scores = results.map((r: any) => r.score);
        const totalMarks = results.reduce((sum: number, r: any) => sum + r.score, 0);
        const ranks = results.map((r: any) => r.rank);

        setStats({
          totalContests: new Set(results.map(r => r.contestId)).size,
          totalAttempts: attempts,
          averageScore: results.length > 0 ? Math.round(totalMarks / attempts) : 0,
          bestScore: Math.max(...scores),
          worstScore: Math.min(...scores),
          passRate: Math.round((passed / attempts) * 100),
          totalMarksEarned: totalMarks,
          averageRank: Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchStats();
    }
  }, [participantId]);

  return { stats, loading, error };
}
