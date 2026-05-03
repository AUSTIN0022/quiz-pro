import { useState, useEffect } from 'react';
import { Contest, Registration } from '@/lib/types';
import { contestService } from '@/lib/services/contest-service';

interface DashboardData {
  upcomingContests: Contest[];
  activeContests: Contest[];
  pastContests: Contest[];
  registrations: Map<string, Registration>;
}

export function useParticipantDashboard(participantId: string) {
  const [data, setData] = useState<DashboardData>({
    upcomingContests: [],
    activeContests: [],
    pastContests: [],
    registrations: new Map(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, use empty data structure
        // In a real app, this would call proper API endpoints
        const contests: Contest[] = [];
        const now = new Date();

        const upcoming: Contest[] = [];
        const active: Contest[] = [];
        const past: Contest[] = [];

        contests.forEach((contest: Contest) => {
          const startTime = new Date(contest.contestStartTime);
          const endTime = new Date(contest.contestEndTime);

          if (startTime > now) {
            upcoming.push(contest);
          } else if (endTime > now) {
            active.push(contest);
          } else {
            past.push(contest);
          }
        });

        const registrations = new Map<string, Registration>();
        // Registrations would be fetched from API

        setData({
          upcomingContests: upcoming,
          activeContests: active,
          pastContests: past,
          registrations,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchData();
    }
  }, [participantId]);

  return { ...data, loading, error };
}
