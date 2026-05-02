'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Download, Send, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { RegistrationsTable } from '@/components/features/registrations/RegistrationsTable';
import { ParticipantDetailDrawer } from '@/components/features/registrations/ParticipantDetailDrawer';
import { downloadCSV } from '@/lib/utils/csv-export';
import type { Registration } from '@/lib/types';

export default function RegistrationsPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [searchText, setSearchText] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    registrations,
    loading,
    filters,
    updateFilters,
    clearFilters,
    exportCSV,
    revokeRegistrations
  } = useRegistrations(contestId);

  const stats = {
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    pending: registrations.filter(r => r.status === 'pending').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
    total: registrations.length
  };

  const handleSearch = useCallback(() => {
    updateFilters({ search: searchText });
  }, [searchText, updateFilters]);

  const handleExportCSV = useCallback(async () => {
    try {
      const csv = await exportCSV();
      downloadCSV(csv, `registrations-${contestId}-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Registrations exported successfully');
    } catch (err) {
      toast.error('Failed to export registrations');
    }
  }, [exportCSV, contestId]);

  const handleRowClick = useCallback((registration: Registration) => {
    setSelectedRegistration(registration);
    setDrawerOpen(true);
  }, []);

  const handleRevoke = useCallback(async (registrationIds: string[]) => {
    try {
      await revokeRegistrations(registrationIds);
      toast.success(`${registrationIds.length} registration(s) revoked`);
    } catch (err) {
      toast.error('Failed to revoke registrations');
    }
  }, [revokeRegistrations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Registrations</h1>
        <p className="text-muted-foreground">Manage contest registrations and participants</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={clearFilters}
              variant="outline"
              disabled={Object.keys(filters).length === 0}
            >
              Clear Filters
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registrations
            <Badge variant="secondary" className="ml-2">
              {registrations.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${registrations.length} registrations`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationsTable
            registrations={registrations}
            onRowClick={handleRowClick}
            onRevoke={handleRevoke}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <ParticipantDetailDrawer
        registration={selectedRegistration}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
