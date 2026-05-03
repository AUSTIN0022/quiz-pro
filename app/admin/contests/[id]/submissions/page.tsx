'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    MoreHorizontal, 
    Eye, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Loader2 
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmissions } from '@/lib/hooks/useSubmissions';
import { format } from 'date-fns';

export default function SubmissionsPage() {
    const params = useParams();
    const contestId = params.id as string;
    const { submissions, loading, error } = useSubmissions(contestId);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'in_progress' | 'flagged'>('all');

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            const matchesSearch = sub.participantId.toLowerCase().includes(searchQuery.toLowerCase());
            const hasViolations = (sub.proctoringViolations || []).length > 0;
            const status = hasViolations ? 'flagged' : sub.status;
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [submissions, searchQuery, statusFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
                <p className="text-muted-foreground">
                    Review and audit all participant attempts and proctoring logs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{submissions.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged by AI</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {submissions.filter(s => (s.proctoringViolations || []).length > 0).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {submissions.filter(s => s.status === 'submitted').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search participant ID..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Participant ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time Spent</TableHead>
                            <TableHead>Proctoring</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSubmissions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No submissions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSubmissions.map((sub) => {
                                const violations = sub.proctoringViolations || [];
                                return (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.participantId}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'submitted' ? 'default' : 'secondary'}>
                                                {sub.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s</TableCell>
                                        <TableCell>
                                            {violations.length > 0 ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {violations.length} Alerts
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Clear</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {sub.submittedAt ? format(new Date(sub.submittedAt), 'MMM d, HH:mm') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="h-4 w-4" /> View Responses
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Search className="h-4 w-4" /> Proctoring Logs
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive gap-2">
                                                        Disqualify
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
