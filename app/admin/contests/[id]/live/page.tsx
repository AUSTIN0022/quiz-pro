'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { LayoutGrid, List, Download, Send, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { useAdminContestSocket } from '@/lib/hooks/useAdminContestSocket';
import { LiveParticipantCard } from '@/components/features/live-monitor/LiveParticipantCard';
import { LeaderboardPodium } from '@/components/features/leaderboard/LeaderboardPodium';
import { ScoreDistributionChart } from '@/components/features/leaderboard/ScoreDistributionChart';
import { BroadcastPanel } from '@/components/features/live-monitor/BroadcastPanel';
import { ParticipantDetailDrawer } from '@/components/features/registrations/ParticipantDetailDrawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function LiveMonitorPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchText, setSearchText] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const {
    leaderboard,
    loading: leaderboardLoading,
    getScorePercentiles
  } = useLeaderboard(contestId, 5000);

  const { connected, participants, sendBroadcast, getParticipantStats } = useAdminContestSocket(
    contestId,
    'admin-user-123'
  );

  const stats = getParticipantStats();

  const filteredParticipants = useMemo(() => {
    if (!searchText) return participants;
    const search = searchText.toLowerCase();
    return participants.filter(
      p =>
        p.participantName.toLowerCase().includes(search) ||
        p.participantId.toLowerCase().includes(search)
    );
  }, [participants, searchText]);

  const topThree = leaderboard.slice(0, 3);
  const scoreDistribution = useMemo(() => {
    const dist: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    leaderboard.forEach(result => {
      const scorePercent = (result.score / result.totalMarks) * 100;
      if (scorePercent <= 20) dist['0-20']++;
      else if (scorePercent <= 40) dist['21-40']++;
      else if (scorePercent <= 60) dist['41-60']++;
      else if (scorePercent <= 80) dist['61-80']++;
      else dist['81-100']++;
    });

    return dist;
  }, [leaderboard]);

  const handleBroadcast = useCallback(
    (message: string, type: 'info' | 'warning' | 'urgent', target: 'all' | 'active' | 'waiting') => {
      sendBroadcast(message, type, target);
      toast.success('Broadcast sent successfully');
    },
    [sendBroadcast]
  );

  const selectedParticipant = leaderboard.find(r => r.participantId === selectedParticipantId) ? {
    id: 'reg-' + selectedParticipantId,
    contestId,
    participantId: selectedParticipantId || '',
    status: 'confirmed' as const,
    registeredAt: new Date().toISOString(),
    paymentStatus: 'completed' as const,
    participantDetails: {
      fullName: leaderboard.find(r => r.participantId === selectedParticipantId)?.participantName || '',
      email: '',
      phone: '',
      country: ''
    }
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Monitor</h1>
            <p className="text-muted-foreground">Real-time contest participation tracking</p>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <Input
                      placeholder="Search participants..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        onClick={() => setViewMode('grid')}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        onClick={() => setViewMode('table')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredParticipants.map(participant => (
                    <div
                      key={participant.participantId}
                      onClick={() => setSelectedParticipantId(participant.participantId)}
                    >
                      <LiveParticipantCard participant={participant} />
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Time on Q</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alerts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map(p => (
                        <TableRow
                          key={p.participantId}
                          onClick={() => setSelectedParticipantId(p.participantId)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium">{p.participantName}</TableCell>
                          <TableCell>
                            {p.currentQuestion}/{p.totalQuestions}
                          </TableCell>
                          <TableCell>
                            {Math.floor(p.timeOnQuestion / 60)}m {p.timeOnQuestion % 60}s
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.status}</Badge>
                          </TableCell>
                          <TableCell>{p.proctoringAlerts || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>

            {/* Broadcast Panel */}
            <BroadcastPanel onSend={handleBroadcast} />
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          {/* Podium */}
          {topThree.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <LeaderboardPodium topThree={topThree} />
              </CardContent>
            </Card>
          )}

          {/* Score Distribution */}
          {leaderboard.length > 0 && (
            <ScoreDistributionChart data={scoreDistribution} />
          )}

          {/* Leaderboard Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Full Leaderboard</CardTitle>
              <CardDescription>Top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.slice(0, 20).map(result => (
                    <TableRow
                      key={result.participantId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedParticipantId(result.participantId)}
                    >
                      <TableCell className="font-bold">{result.rank}</TableCell>
                      <TableCell>{result.participantName}</TableCell>
                      <TableCell className="text-right font-medium">{result.score}</TableCell>
                      <TableCell className="text-right">
                        {Math.round((result.score / result.totalMarks) * 100)}%
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {result.timeTaken}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Participant Detail Drawer */}
      {selectedParticipant && (
        <ParticipantDetailDrawer
          registration={selectedParticipant}
          open={!!selectedParticipantId}
          onOpenChange={(open) => {
            if (!open) setSelectedParticipantId(null);
          }}
        />
      )}
    </div>
  );
}
