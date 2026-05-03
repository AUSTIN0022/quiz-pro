'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  Flag, 
  User,
  History,
  MoreVertical,
  MonitorOff,
  ScanEye,
  Copy,
  Maximize,
  ArrowRight,
  Clock,
  ExternalLink,
  Bot,
  Trash2,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContestDetail } from '@/lib/hooks/useContestDetail';
import { useAdminContestSocket, ProctorAlert } from '@/lib/hooks/useAdminContestSocket';
import { deriveContestPhase } from '@/lib/utils/contest';
import { submissionService } from '@/lib/services/submission-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProctoringAlertsTabPage() {
  const { id } = useParams() as { id: string };
  const { data: contest } = useContestDetail(id);
  
  const contestPhase = useMemo(() => {
    if (!contest) return 'DRAFT';
    return deriveContestPhase(contest);
  }, [contest]);

  const [historicalAlerts, setHistoricalAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // WebSocket for real-time alerts
  const { participants, connected } = useAdminContestSocket(
    id, 
    'admin-123',
    undefined,
    undefined,
    (alert) => {
      // Toast notification for live alerts
      const isAutoSubmit = alert.autoSubmitted || alert.warningCount >= alert.maxWarnings;
      
      toast(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold">
            {isAutoSubmit ? <Bot className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {alert.name} — {isAutoSubmit ? 'Auto-submitted' : alert.type.replace('-', ' ')}
          </div>
          <div className="text-xs text-muted-foreground">
            {isAutoSubmit ? 'Session auto-submitted after 3 proctoring violations.' : `Warning ${alert.warningCount}/${alert.maxWarnings} — ${alert.questionContext}`}
          </div>
        </div>,
        {
          duration: isAutoSubmit ? 12000 : 8000,
          action: {
            label: 'View Details',
            onClick: () => setSelectedParticipantId(alert.participantId)
          },
          className: isAutoSubmit ? 'border-destructive bg-destructive/5' : ''
        }
      );
    }
  );

  // Fetch historical data if not live or for initial load
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      const res = await submissionService.getProctoringAlerts(id);
      if (res.success && res.data) {
        setHistoricalAlerts(res.data);
      }
      setIsLoading(false);
    };
    fetchAlerts();
  }, [id]);

  // Merge live and historical data
  const proctoringData = useMemo(() => {
    if (contestPhase === 'LIVE') {
      // Use participants from socket
      return participants.map(p => ({
        participantId: p.participantId,
        name: p.name,
        avatarInitials: p.avatarInitials,
        alertCount: p.proctoringAlerts,
        status: p.status,
        lastAlertAt: p.lastActivityAt, // Approximating last alert time
        violations: [], // Socket doesn't send full list in BULK_UPDATE yet
        isInWaitingRoom: p.isInWaitingRoom
      }));
    }
    return historicalAlerts;
  }, [contestPhase, participants, historicalAlerts]);

  const filteredData = useMemo(() => {
    return proctoringData.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.participantId.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesSeverity = true;
      if (severityFilter === 'flagged') matchesSeverity = p.alertCount >= 3;
      else if (severityFilter === 'warning') matchesSeverity = p.alertCount >= 1 && p.alertCount < 3;
      else if (severityFilter === 'clean') matchesSeverity = p.alertCount === 0;
      else if (severityFilter === 'auto-submitted') matchesSeverity = p.status === 'submitted' && p.alertCount >= 3; // Simplified logic

      return matchesSearch && matchesSeverity;
    }).sort((a, b) => b.alertCount - a.alertCount);
  }, [proctoringData, searchQuery, severityFilter]);

  const summaryStats = useMemo(() => {
    return {
      flagged: proctoringData.filter(p => p.alertCount >= 3).length,
      autoSubmitted: proctoringData.filter(p => p.status === 'submitted' && p.alertCount >= 3).length,
      warnings: proctoringData.filter(p => p.alertCount >= 1 && p.alertCount < 3).length,
      clean: proctoringData.filter(p => p.alertCount === 0).length,
    };
  }, [proctoringData]);

  if (isLoading && contestPhase !== 'LIVE') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading proctoring data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          label="Flagged Sessions" 
          value={summaryStats.flagged} 
          icon={ShieldAlert} 
          color={summaryStats.flagged > 0 ? "red" : "neutral"} 
          description=">= 3 total warnings"
        />
        <SummaryCard 
          label="Auto-Submitted" 
          value={summaryStats.autoSubmitted} 
          icon={XCircle} 
          color="red" 
          description="Violations reached limit"
        />
        <SummaryCard 
          label="With Warnings" 
          value={summaryStats.warnings} 
          icon={AlertTriangle} 
          color="amber" 
          description="1-2 total warnings"
        />
        <SummaryCard 
          label="Clean Sessions" 
          value={summaryStats.clean} 
          icon={ShieldCheck} 
          color="green" 
          description="Zero warnings logged"
        />
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search participant name or ID..." 
              className="pl-9 bg-muted/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {severityFilter === 'all' ? 'All Severity' : severityFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSeverityFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter('flagged')}>Flagged (3+)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter('warning')}>Warning (1-2)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter('auto-submitted')}>Auto-Submitted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter('clean')}>Clean</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="outline" size="sm" onClick={() => toast.success('Proctoring report export started')}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* ALERTS TABLE */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4 text-left">Participant</th>
                <th className="px-6 py-4 text-center">Alert Count</th>
                <th className="px-6 py-4 text-left">Alert Types</th>
                <th className="px-6 py-4 text-center">Severity</th>
                <th className="px-6 py-4 text-center">Submission</th>
                <th className="px-6 py-4 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredData.map((p) => (
                <tr key={p.participantId} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-full border border-border/50">
                        <AvatarFallback className="text-xs font-black bg-primary/10 text-primary uppercase">
                          {p.avatarInitials || p.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.participantId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-lg font-black",
                      p.alertCount >= 3 ? "text-destructive" : p.alertCount >= 1 ? "text-amber-500" : "text-green-600"
                    )}>
                      {p.alertCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <AlertTypeChip type="Tab" count={3} />
                      <AlertTypeChip type="Cam" count={1} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <SeverityBadge count={p.alertCount} status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedParticipantId(p.participantId)}>
                        Details
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success('Warnings dismissed')}>
                            Dismiss All Warnings
                          </DropdownMenuItem>
                          <DropdownMenuItem>Mark as Reviewed</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* DETAIL DRAWER */}
      <ProctoringDetailDrawer 
        participantId={selectedParticipantId}
        onClose={() => setSelectedParticipantId(null)}
        contestPhase={contestPhase}
      />

    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════

function SummaryCard({ label, value, icon: Icon, color, description }: { 
  label: string; 
  value: number; 
  icon: any; 
  color: string; 
  description: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-2.5 rounded-xl",
            color === 'red' ? "bg-destructive/10 text-destructive" :
            color === 'amber' ? "bg-amber-500/10 text-amber-600" :
            color === 'green' ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="mt-1">
          <div className="text-3xl font-black">{value}</div>
          <span className="text-xs font-bold text-foreground block mt-0.5">{label}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertTypeChip({ type, count }: { type: string; count: number }) {
  return (
    <div className="flex items-center h-6 rounded-md bg-muted/50 border border-border/40 overflow-hidden">
      <span className="px-2 text-[10px] font-bold text-muted-foreground">{type}</span>
      <div className="bg-muted-foreground/10 px-1.5 h-full flex items-center text-[10px] font-black border-l border-border/40">
        ×{count}
      </div>
    </div>
  );
}

function SeverityBadge({ count, status }: { count: number; status: string }) {
  if (status === 'submitted' && count >= 3) {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-black py-0.5 px-2">
        <Bot className="mr-1 h-3 w-3" /> Auto-Submitted
      </Badge>
    );
  }
  if (count >= 3) {
    return <Badge className="bg-destructive text-white border-none text-[10px] uppercase font-black py-0.5 px-2">Flagged</Badge>;
  }
  if (count >= 1) {
    return <Badge className="bg-amber-500 text-white border-none text-[10px] uppercase font-black py-0.5 px-2">Warning</Badge>;
  }
  return <Badge variant="outline" className="text-green-600 border-green-600/30 text-[10px] uppercase font-black py-0.5 px-2">Clean</Badge>;
}

function ProctoringDetailDrawer({ 
  participantId, 
  onClose, 
  contestPhase 
}: { 
  participantId: string | null; 
  onClose: () => void;
  contestPhase: string;
}) {
  const [activeTab, setActiveTab] = useState('timeline');
  
  if (!participantId) return null;

  return (
    <Sheet open={!!participantId} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/10 p-0.5">
                <AvatarFallback className="text-xl font-black bg-primary/10 text-primary uppercase">P</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <SheetTitle className="text-xl font-black">Participant {participantId.split('-')[1]}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">{participantId}</span>
                  <SeverityBadge count={3} status="active" />
                </div>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="p-0 bg-destructive text-white text-[10px] font-black uppercase tracking-widest text-center py-2">
          Flagged Session — Critical Attention Required
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 h-9 bg-muted/50 p-1">
              <TabsTrigger value="timeline" className="text-xs">Alert Timeline</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="timeline" className="m-0 space-y-6 pb-20">
              <div className="relative space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                <AlertEvent 
                  type="tab-switch" 
                  description="Tab switch detected" 
                  question="Question 15" 
                  time="10:15:23 AM" 
                />
                <AlertEvent 
                  type="no-face" 
                  description="No face detected for 7 seconds" 
                  question="Question 18" 
                  time="10:22:45 AM" 
                />
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-black text-destructive">Flagged — 3rd warning reached</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-destructive">10:30:12 AM</span>
                </div>
                <div className="p-3 bg-destructive text-white rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5" />
                    <span className="text-sm font-black">Auto-submitted by system</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold">10:30:15 AM</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="m-0 space-y-8 pb-20">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Violation Breakdown</h4>
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr className="text-muted-foreground">
                        <th className="px-4 py-2 text-left font-bold">Type</th>
                        <th className="px-4 py-2 text-center font-bold">Count</th>
                        <th className="px-4 py-2 text-right font-bold">Last</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      <tr>
                        <td className="px-4 py-2 font-medium">Tab Switch</td>
                        <td className="px-4 py-2 text-center font-bold">3</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">10:47:12 AM</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">No Face</td>
                        <td className="px-4 py-2 text-center font-bold">1</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">10:32:45 AM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 space-y-1">
                <div className="flex items-center gap-2 text-destructive font-black text-xs uppercase tracking-tight">
                  <Bot className="h-4 w-4" />
                  Auto-submitted session
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Participant reached the maximum allowed proctoring violations (3) at 10:30:12 AM. The system automatically terminated and submitted the quiz session.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Notes</label>
                <textarea 
                  className="w-full h-24 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Add a note about this session for manual review..."
                />
                <Button variant="secondary" size="sm" className="w-full h-9">Save Note</Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="mt-auto p-6 border-t bg-muted/5 grid grid-cols-2 gap-3">
          {contestPhase === 'LIVE' ? (
            <>
              <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50">
                Dismiss All Warnings
              </Button>
              <Button variant="destructive">Force Submit</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="border-primary/20 text-primary">
                Mark as Reviewed
              </Button>
              <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50">
                Flag for Manual Review
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function AlertEvent({ type, description, question, time }: { type: string; description: string; question: string; time: string }) {
  const dotColor = {
    'tab-switch': 'bg-amber-500',
    'no-face': 'bg-red-500',
    'camera-off': 'bg-muted-foreground/30',
    'fullscreen-exit': 'bg-orange-500',
    'multiple-faces': 'bg-red-500',
    'copy-paste': 'bg-purple-500'
  }[type] || 'bg-primary';

  const Icon = {
    'tab-switch': Copy,
    'no-face': ScanEye,
    'camera-off': MonitorOff,
    'fullscreen-exit': Maximize
  }[type] || AlertTriangle;

  return (
    <div className="relative pl-7 flex flex-col gap-1 group">
      <div className={cn("absolute left-1 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-background z-10", dotColor)} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <Icon className="h-3 w-3 opacity-60" />
          {description}
        </span>
        <span className="text-[9px] font-mono font-bold text-muted-foreground">{time}</span>
      </div>
      <span className="text-[10px] text-muted-foreground italic">— {question}</span>
    </div>
  );
}
