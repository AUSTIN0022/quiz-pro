import { useCallback, useEffect, useState } from 'react';
import { registrationService } from '@/lib/services/registration-service';
import type { Registration } from '@/lib/types';

interface RegistrationFilters {
  status?: string;
  payment?: string;
  search?: string;
  dateRange?: { from: string; to: string };
}

export function useRegistrations(contestId: string) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RegistrationFilters>({});

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await registrationService.getRegistrations(contestId, filters);

      if (response.success && response.data) {
        setRegistrations(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch registrations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contestId, filters]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const updateFilters = useCallback((newFilters: Partial<RegistrationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const exportCSV = useCallback(async () => {
    try {
      const csv = await registrationService.exportRegistrationsCSV(registrations);
      return csv;
    } catch (err) {
      console.error('[v0] CSV export failed:', err);
      throw err;
    }
  }, [registrations]);

  const revokeRegistrations = useCallback(
    async (registrationIds: string[]) => {
      try {
        const response = await registrationService.bulkRevokeRegistrations(registrationIds);
        if (response.success) {
          setRegistrations(prev =>
            prev.map(r =>
              registrationIds.includes(r.id) ? { ...r, status: 'cancelled' as const } : r
            )
          );
        }
        return response;
      } catch (err) {
        console.error('[v0] Revoke failed:', err);
        throw err;
      }
    },
    []
  );

  return {
    registrations,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    exportCSV,
    revokeRegistrations,
    refetch: fetchRegistrations
  };
}
