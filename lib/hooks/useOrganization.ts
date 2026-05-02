import { useState, useCallback, useEffect } from 'react';
import { Organization, ApiResponse } from '@/lib/types';
import { organizationService } from '@/lib/services/organization-service';

export function useOrganization(orgId: string) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationService.getOrganization(orgId);
        if (response.success && response.data) {
          setOrg(response.data);
        } else {
          setError(response.message || 'Failed to load organization');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchOrg();
    }
  }, [orgId]);

  const updateOrg = useCallback(
    async (updates: Partial<Organization>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationService.updateOrganization(orgId, updates);
        if (response.success && response.data) {
          setOrg(response.data);
          return response.data;
        } else {
          setError(response.message || 'Failed to update organization');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId]
  );

  return { org, loading, error, updateOrg };
}
