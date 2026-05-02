'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useResults } from '@/lib/hooks/useResults';
import { LeaderboardPodium } from '@/components/features/leaderboard/LeaderboardPodium';
import { ScoreDistributionChart } from '@/components/features/leaderboard/ScoreDistributionChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { resultsToCSV, downloadCSV } from '@/lib/utils/csv-export';

interface ResultsStats {
  totalParticipants: number;
  avgScore: number;
  passPercentage: number;
  topScore: number;
}

export default function ResultsPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [currentPage, setCurrentPage] = useState(1);
  const [publishLoading, setPublishLoading] = useState(false);

  const {
    results,
    loading,
    error,
    published,
    evaluated,
    evaluatedCount,
    publishResults,
    getScoreDistribution
  } = useResults(contestId);

  const itemsPerPage = 25;
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const scoreDistribution = getScoreDistribution();

  const stats = useMemo((): ResultsStats => {
    if (results.length === 0) {
      return {
        totalParticipants: 0,
        avgScore: 0,
        passPercentage: 0,
        topScore: 0
      };
    }

    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const passCount = results.filter(r => r.isPassed).length;
    const passPercentage = Math.round((passCount / results.length) * 100);
    const topScore = Math.max(...results.map(r => r.score));

    return {
      totalParticipants: results.length,
      avgScore,
      passPercentage,
      topScore
    };
  }, [results]);

  const handlePublishResults = useCallback(async () => {
    try {
      setPublishLoading(true);
      const response = await publishResults();
      if (response.success) {
        toast.success('Results published successfully');
      } else {
        toast.error(response.error || 'Failed to publish results');
      }
    } catch (err) {
      toast.error('An error occurred while publishing results');
    } finally {
      setPublishLoading(false);
    }
  }, [publishResults]);

  const handleExportCSV = useCallback(() => {
    try {
      const csv = resultsToCSV(results);
      downloadCSV(csv, `results-${contestId}-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Results exported successfully');
    } catch (err) {
      toast.error('Failed to export results');
    }
  }, [results, contestId]);

  const handleExportPDF = useCallback(() => {
    toast.info('PDF export coming soon');
  }, []);

  const topThree = results.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Quiz Results</h1>
        <p className="text-muted-foreground">Manage and analyze quiz results</p>
      </div>

      {/* Status Banner */}
      <Card className={published ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Results Status</p>
              <p className="text-sm text-muted-foreground">
                {published ? 'Results are published and visible to participants' : 'Results are not yet published'}
              </p>
            </div>
            {published && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Published</span>
              </div>
            )}
            {!published && (
              <Button
                onClick={handlePublishResults}
                disabled={publishLoading || results.length === 0}
              >
                {publishLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalParticipants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.topScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.passPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {topThree.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <LeaderboardPodium topThree={topThree} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results Table</CardTitle>
              <CardDescription>Detailed results for all participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Correct</TableHead>
                    <TableHead className="text-right">Wrong</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map(result => (
                    <TableRow key={result.attemptId}>
                      <TableCell className="font-bold">{result.rank}</TableCell>
                      <TableCell>{result.participantName}</TableCell>
                      <TableCell className="text-right font-medium">{result.score}/{result.totalMarks}</TableCell>
                      <TableCell className="text-right text-green-600">{result.correctAnswers}</TableCell>
                      <TableCell className="text-right text-red-600">{result.wrongAnswers}</TableCell>
                      <TableCell className="text-right text-sm">{result.timeTaken}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={result.isPassed ? 'default' : 'secondary'}>
                          {result.isPassed ? 'Passed' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          {results.length > 0 && <ScoreDistributionChart data={scoreDistribution} />}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Average Performance</span>
                  <span className="text-sm font-bold">{Math.round((stats.avgScore / 100) * 100)}%</span>
                </div>
                <Progress value={(stats.avgScore / 100) * 100} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Difficulty Level</p>
                  <p className="text-lg font-bold">Moderate</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-bold">95%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Options</CardTitle>
              <CardDescription>Download results in different formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
