'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContest } from '@/lib/hooks/useContest';
import { PublicLinkCard } from '@/components/features/contest/PublicLinkCard';

export default function ContestOverviewPage() {
  const params = useParams();
  const contestId = params.id as string;
  const { contest, stats, loading, isContestActive, isRegistrationOpen, getTimeRemaining } = useContest(contestId);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeRemaining]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading contest details...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Contest not found</p>
      </div>
    );
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{contest.title}</h1>
        <p className="text-muted-foreground">{contest.description}</p>
      </div>

      {/* Status Banner */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/50">
        <div>
          <p className="text-sm font-medium">Contest Status</p>
          <p className="text-2xl font-bold mt-1">{contest.status.toUpperCase()}</p>
        </div>
        <div className="space-y-2">
          {isContestActive() && timeRemaining !== null && (
            <div>
              <p className="text-sm text-amber-600 font-medium">Time Remaining</p>
              <p className="text-lg font-bold text-amber-600">{formatTime(timeRemaining)}</p>
            </div>
          )}
          <Badge
            variant={isRegistrationOpen() ? 'default' : 'secondary'}
          >
            {isRegistrationOpen() ? '📖 Registration Open' : 'Registration Closed'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalRegistered}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.confirmedRegistrations}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stats.confirmedRegistrations / stats.totalRegistered) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.paidRegistrations}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline">Edit Contest</Button>
              <Button variant="outline">Manage Questions</Button>
              <Button variant="outline">View Registrations</Button>
              <Button variant="outline">Go Live Monitor</Button>
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Registrations</CardTitle>
              <CardDescription>Last 5 registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">Participant {i}</p>
                      <p className="text-xs text-muted-foreground">participant{i}@example.com</p>
                    </div>
                    <Badge variant="outline">Confirmed</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <PublicLinkCard
          contestId={contestId}
          orgSlug="org"
          contestSlug={contest.slug}
          contestTitle={contest.title}
        />
      </div>
    </div>
  );
}
