'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  FileQuestion,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContestDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  totalQuestions: string;
  totalMarks: string;
  registrationFee: string;
  maxParticipants: string;
}

export default function ContestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewContest = searchParams.get('success') === 'created';
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load contest from localStorage (for new contest)
    if (isNewContest) {
      const newContestData = localStorage.getItem('newContest');
      if (newContestData) {
        const parsed = JSON.parse(newContestData);
        setContest({
          id: params.id,
          title: parsed.title,
          description: parsed.description,
          category: parsed.category,
          totalQuestions: parsed.totalQuestions,
          totalMarks: parsed.totalMarks,
          registrationFee: parsed.registrationFee,
          maxParticipants: parsed.maxParticipants,
        });
      }
    } else {
      // In production, fetch from API
      setContest({
        id: params.id,
        title: 'Contest Name',
        description: 'Contest Description',
        category: 'programming',
        totalQuestions: '50',
        totalMarks: '100',
        registrationFee: '299',
        maxParticipants: '1000',
      });
    }

    setLoading(false);
  }, [params.id, isNewContest, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold">Contest Not Found</h1>
            <div className="w-[120px]" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">Contest not found</p>
              <p className="text-muted-foreground mt-2">The contest you're looking for doesn't exist.</p>
              <Link href="/admin" className="mt-6 inline-block">
                <Button>Go to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold">Contest Details</h1>
          <div className="w-[120px]" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Success Message */}
        {isNewContest && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Contest created successfully! Now add questions to your contest.
            </AlertDescription>
          </Alert>
        )}

        {/* Contest Summary */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{contest.title}</CardTitle>
                <CardDescription className="mt-2 text-base">{contest.description}</CardDescription>
              </div>
              <Badge variant="outline">{contest.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold mt-1">{contest.totalQuestions}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold mt-1">{contest.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registration Fee</p>
                <p className="text-2xl font-bold mt-1">₹{contest.registrationFee}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Participants</p>
                <p className="text-2xl font-bold mt-1">{contest.maxParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Next Steps
            </CardTitle>
            <CardDescription>Set up your contest questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Step 1: Select Question Source */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Select Question Source</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose whether to upload your own questions or select from our question bank
                  </p>
                </div>
                <Button size="sm" variant="outline" className="whitespace-nowrap" asChild>
                  <Link href={`/admin/contests/${contest.id}/questions`}>Select</Link>
                </Button>
              </div>

              {/* Step 2: Configure Questions */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/30 opacity-60">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Configure Questions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set difficulty levels, topics, and distribution for selected questions
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="whitespace-nowrap" disabled>
                  Configure
                </Button>
              </div>

              {/* Step 3: Review & Publish */}
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/30 opacity-60">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Review & Publish</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review your contest setup and publish it for participants
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="whitespace-nowrap" disabled>
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex gap-3">
          <Link href="/admin/contests" className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
          <Link href={`/admin/contests/${contest.id}/questions`} className="flex-1">
            <Button className="w-full">
              <FileQuestion className="h-4 w-4 mr-2" />
              Add Questions
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
