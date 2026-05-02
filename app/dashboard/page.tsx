'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Trophy, BookOpen, FileCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParticipantDashboard } from '@/lib/hooks/useParticipantDashboard';
import { useParticipantStats } from '@/lib/hooks/useParticipantStats';

const PARTICIPANT_ID = 'QZCP12345ABC'; // In real app, get from auth context

interface CountdownState {
  [key: string]: string;
}

export default function DashboardPage() {
  const { upcomingContests, activeContests, pastContests, loading, error } =
    useParticipantDashboard(PARTICIPANT_ID);
  const { stats } = useParticipantStats(PARTICIPANT_ID);
  const [countdowns, setCountdowns] = useState<CountdownState>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdowns: CountdownState = {};
      const now = new Date();

      [...upcomingContests, ...activeContests].forEach((contest) => {
        const startTime = new Date(contest.contestStartTime);
        const diff = startTime.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            newCountdowns[contest.id] = `${days}d ${hours}h`;
          } else if (hours > 0) {
            newCountdowns[contest.id] = `${hours}h ${minutes}m`;
          } else {
            newCountdowns[contest.id] = `${minutes}m`;
          }
        }
      });

      setCountdowns(newCountdowns);
    }, 60000);

    return () => clearInterval(timer);
  }, [upcomingContests, activeContests]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your quiz activity</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{stats.totalAttempts}</p>
                <p className="text-sm text-muted-foreground">Attempts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold">{stats.passRate}%</p>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-3xl font-bold">{stats.averageScore}</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-3xl font-bold">#{stats.averageRank}</p>
                <p className="text-sm text-muted-foreground">Avg Rank</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Contests */}
      {activeContests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Live Now - Join Immediately
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeContests.map((contest) => (
                <div key={contest.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{contest.title}</p>
                    <p className="text-sm text-muted-foreground">{contest.description}</p>
                  </div>
                  <Link href={`/quiz/${contest.id}/entry`}>
                    <Button className="bg-yellow-600 hover:bg-yellow-700">Join Now</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Contests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Contests</h2>
          <Link href="/dashboard/contests">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {upcomingContests.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No upcoming contests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingContests.slice(0, 4).map((contest) => (
              <Card key={contest.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{contest.title}</CardTitle>
                  <CardDescription>{contest.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(contest.contestDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{contest.durationMinutes} minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starts in:</span>
                    <span className="font-medium">{countdowns[contest.id] || 'Soon'}</span>
                  </div>
                  <Link href={`/quiz/${contest.id}/entry`}>
                    <Button className="w-full">Register Now</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/results">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <FileCheck className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">My Results</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/certificates">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Certificates</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/profile">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="font-medium">Profile</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/contests">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">All Contests</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
