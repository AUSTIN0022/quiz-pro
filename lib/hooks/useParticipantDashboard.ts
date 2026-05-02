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
        const contests = await contestService.getAllContests();
        const now = new Date();

        const upcoming: Contest[] = [];
        const active: Contest[] = [];
        const past: Contest[] = [];

        contests.forEach(contest => {
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
        const allRegistrations = await contestService.getRegistrations(participantId);
        allRegistrations.forEach(reg => {
          registrations.set(reg.contestId, reg);
        });

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
