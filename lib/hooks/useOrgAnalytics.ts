import { useState, useCallback } from 'react';
import { analyticsService } from '@/lib/services/analytics-service';
import { toast } from 'sonner';

export function useOrgAnalytics(orgId: string) {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const analytics = analyticsService.getOrgAnalytics(orgId, dateRange);

  const exportCSV = useCallback(async () => {
    setLoading(true);
    try {
      const headers = ['Date', 'Registrations', 'Paid', 'Free', 'Revenue'];
      const rows = analytics.dailyMetrics.map(m => [
        m.date,
        m.registrations,
        m.paid,
        m.free,
        m.revenue,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setLoading(false);
    }
  }, [analytics.dailyMetrics]);

  return {
    analytics,
    dateRange,
    setDateRange,
    loading,
    exportCSV,
  };
}
