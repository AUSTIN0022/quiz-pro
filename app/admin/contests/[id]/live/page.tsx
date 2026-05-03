'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
    Users,
    UserCheck,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Search,
    Filter,
    LayoutGrid,
    List,
    MoreVertical,
    Eye,
    ArrowRight,
    Radio,
    Send,
    Loader2,
    ChevronDown,
    Timer,
    ExternalLink,
    MessageCircle,
    X,
    History,
    ShieldCheck,
    ShieldAlert,
    TrendingUp,
    BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from 'recharts';

import { useContestDetail } from '@/lib/hooks/useContestDetail';
import { useAdminContestSocket, LiveParticipant, BroadcastMessage } from '@/lib/hooks/useAdminContestSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RankedOutliersSection } from '@/components/features/live-monitor/RankedOutliersSection';
import { AnomalyFeedSection, type AnomalyEvent } from '@/components/features/live-monitor/AnomalyFeedSection';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function LiveMonitorTabPage() {
    const { id } = useParams() as { id: string };
    const { data: contest } = useContestDetail(id);

    // Real-time WebSocket connection
    const {
        connected,
        participants,
        messages,
        sendBroadcast,
        getParticipantStats,
        forceSubmitParticipant
    } = useAdminContestSocket(id, 'admin-123'); // Mock admin ID

    const [activeSubTab, setActiveSubTab] = useState<'grid' | 'leaderboard'>('grid');
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'outliers'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<LiveParticipant | null>(null);
    const [anomalyEvents, setAnomalyEvents] = useState<AnomalyEvent[]>([]);

    // Debug logging for view mode changes
    useEffect(() => {
        console.log("[v0] View mode changed to:", viewMode);
    }, [viewMode]);

    const stats = useMemo(() => getParticipantStats(), [getParticipantStats]);

    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.participantId.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            // Default sort: Progress (desc)
            return b.answeredCount - a.answeredCount;
        });
    }, [participants, searchQuery, statusFilter]);

    if (participants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading participants...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* LIVE STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <LiveStatCard label="Total Joined" value={stats.totalJoined} icon={Users} color="neutral" />
                <LiveStatCard label="Answering Now" value={stats.activeNow} icon={UserCheck} color="green" pulse />
                <LiveStatCard label="Waiting Room" value={stats.inWaitingRoom} icon={Clock} color="blue" />
                <LiveStatCard label="Submitted" value={stats.submitted} icon={CheckCircle2} color="green" />
                <LiveStatCard
                    label="Flagged"
                    value={stats.flagged}
                    icon={AlertTriangle}
                    color="red"
                    alert={stats.flagged > 0}
                />
            </div>

            {/* TIMER + BROADCAST HEADER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-4">
                    <ContestTimer expiryTime={new Date(Date.now() + 1000 * 60 * 45).toISOString()} /> {/* Mock expiry */}
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-fit">
                        <TabsList className="h-8 bg-transparent p-0 gap-2">
                            <TabsTrigger value="grid" className="h-8 px-4 data-[state=active]:bg-background rounded-full border-transparent data-[state=active]:border-border border text-xs">
                                Participant Grid
                            </TabsTrigger>
                            <TabsTrigger value="leaderboard" className="h-8 px-4 data-[state=active]:bg-background rounded-full border-transparent data-[state=active]:border-border border text-xs">
                                Live Leaderboard
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <Button
                    className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-auto"
                    onClick={() => setIsBroadcastOpen(true)}
                >
                    <Radio className="mr-2 h-4 w-4 animate-pulse" />
                    Broadcast Message
                </Button>
            </div>

            {/* SUB-TABS CONTENT */}
            {activeSubTab === 'grid' ? (
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search participants..."
                                className="pl-9 bg-muted/30"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Filter: {statusFilter}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('active')}>Answering</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('submitted')}>Submitted</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('disconnected')}>Disconnected</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('flagged')}>Flagged</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex p-1 bg-muted/50 rounded-lg border border-border/50">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="h-8 w-8 rounded-md"
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="h-8 w-8 rounded-md"
                                    onClick={() => setViewMode('table')}
                                    title="Table View"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'outliers' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2 rounded-md text-xs"
                                    onClick={() => setViewMode('outliers')}
                                    title="Ranked Outliers & Anomaly Feed"
                                >
                                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                                    Outliers
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Grid/Table/Outliers View */}
                    <div key={viewMode}>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {filteredParticipants.map(p => (
                                    <LiveParticipantCard
                                        key={p.participantId}
                                        participant={p}
                                        onClick={() => setSelectedParticipant(p)}
                                    />
                                ))}
                            </div>
                        ) : viewMode === 'table' ? (
                            <LiveTable participants={filteredParticipants} onDetails={(p) => setSelectedParticipant(p)} onForceSubmit={(id) => forceSubmitParticipant(id)} />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <RankedOutliersSection 
                                    participants={participants}
                                    totalParticipants={stats.totalJoined}
                                />
                                <AnomalyFeedSection 
                                    participants={participants}
                                    events={anomalyEvents}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <LiveLeaderboard participants={participants} />
            )}

            {/* BROADCAST PANEL DRAWER */}
            <BroadcastPanel
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
                onSend={sendBroadcast}
                recentMessages={messages}
            />

            {/* PARTICIPANT LIVE DRAWER */}
            <ParticipantLiveDrawer
                participant={selectedParticipant}
                onClose={() => setSelectedParticipant(null)}
                onForceSubmit={(id) => forceSubmitParticipant(id)}
            />

        </div>
    );
}

// ═══════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════

function LiveStatCard({ label, value, icon: Icon, color, pulse, alert }: {
    label: string;
    value: number;
    icon: any;
    color: string;
    pulse?: boolean;
    alert?: boolean;
}) {
    return (
        <Card className={cn(
            "border-border/50 transition-all duration-300",
            alert && "border-destructive/50 shadow-lg shadow-destructive/5"
        )}>
            <CardContent className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-2 rounded-lg bg-muted/50",
                        color === 'green' && "bg-green-500/10 text-green-600",
                        color === 'red' && "bg-destructive/10 text-destructive",
                        color === 'blue' && "bg-blue-500/10 text-blue-600"
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>
                    {pulse && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                </div>
                <div className="mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                    <div className={cn(
                        "text-2xl font-black",
                        alert && "text-destructive animate-pulse"
                    )}>{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function ContestTimer({ expiryTime }: { expiryTime: string }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isCritical, setIsCritical] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const diff = new Date(expiryTime).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft('ENDED');
                clearInterval(timer);
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
            setIsCritical(mins < 10);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiryTime]);

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black",
            isCritical ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
            <Timer className="h-4 w-4" />
            <span>CONTEST ENDS IN {timeLeft}</span>
        </div>
    );
}

function LiveParticipantCard({ participant, onClick }: { participant: LiveParticipant; onClick: () => void }) {
    const statusColor = {
        active: participant.timeOnQuestion > 180 ? 'border-amber-500' : 'border-green-500',
        submitted: 'border-blue-500',
        disconnected: 'border-muted',
        flagged: 'border-destructive'
    }[participant.status];

    return (
        <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            className={cn(
                "bg-background border rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all",
                statusColor,
                "border-l-4"
            )}
            onClick={onClick}
        >
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 rounded-full border border-border/50">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-black uppercase">
                                {participant.avatarInitials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold truncate max-w-[100px]">{participant.name}</span>
                    </div>
                    <Badge variant="outline" className={cn(
                        "text-[9px] font-bold uppercase",
                        participant.status === 'active' ? "text-green-600 border-green-500/20" :
                            participant.status === 'submitted' ? "text-blue-600 border-blue-500/20" :
                                participant.status === 'flagged' ? "text-destructive border-destructive/20" : "text-muted-foreground"
                    )}>
                        {participant.status}
                    </Badge>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Q {participant.currentQuestion} / {participant.totalQuestions}</span>
                        <span>{Math.round((participant.answeredCount / participant.totalQuestions) * 100)}%</span>
                    </div>
                    <Progress
                        value={(participant.answeredCount / participant.totalQuestions) * 100}
                        className={cn(
                            "h-1.5",
                            participant.status === 'submitted' ? "bg-blue-100 [&>div]:bg-blue-500" :
                                participant.status === 'disconnected' ? "bg-muted [&>div]:bg-muted-foreground/30" : "bg-green-100 [&>div]:bg-green-500"
                        )}
                    />
                    <span className="text-[10px] text-muted-foreground block">{participant.answeredCount} answered</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className={cn(
                        "text-[10px] font-medium flex items-center gap-1",
                        participant.timeOnQuestion > 180 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                        <Clock className="h-3 w-3" />
                        On Q{participant.currentQuestion} for {Math.floor(participant.timeOnQuestion / 60)}m {participant.timeOnQuestion % 60}s
                    </div>

                    {participant.proctoringAlerts > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[9px]">
                            {participant.proctoringAlerts} alerts
                        </Badge>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function BroadcastPanel({ isOpen, onClose, onSend, recentMessages }: {
    isOpen: boolean;
    onClose: () => void;
    onSend: any;
    recentMessages: BroadcastMessage[];
}) {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
    const [target, setTarget] = useState<'all' | 'active' | 'waiting'>('all');

    const handleSend = () => {
        if (!message) return;
        onSend(message, type, target);
        setMessage('');
        toast.success('Broadcast sent!');
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-[380px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-primary" />
                        Broadcast Message
                    </SheetTitle>
                    <SheetDescription>Send announcements to all participants</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                        <div className="relative">
                            <textarea
                                className="w-full h-32 p-4 rounded-xl bg-muted/30 border border-border/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                placeholder="Type your message here..."
                                maxLength={280}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-mono">
                                {message.length} / 280
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                        <div className="flex gap-2">
                            {(['info', 'warning', 'urgent'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all",
                                        type === t ? (
                                            t === 'info' ? "bg-blue-500/10 border-blue-500 text-blue-600" :
                                                t === 'warning' ? "bg-amber-500/10 border-amber-500 text-amber-600" :
                                                    "bg-destructive/10 border-destructive text-destructive"
                                        ) : "border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recipients</label>
                        <div className="space-y-2">
                            {[
                                { id: 'all', label: 'All participants', count: 124 },
                                { id: 'active', label: 'Quiz room only', count: 98 },
                                { id: 'waiting', label: 'Waiting room only', count: 26 },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTarget(t.id as any)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                        target === t.id ? "bg-primary/5 border-primary" : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    <span className="text-xs font-medium">{t.label}</span>
                                    <Badge variant="secondary" className="h-5 px-1.5">{t.count}</Badge>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</label>
                        <div className="p-3 bg-[#0a0a0a] rounded-xl overflow-hidden">
                            <motion.div
                                animate={{ x: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className={cn(
                                    "p-2 rounded border-l-2 text-[10px] text-white",
                                    type === 'info' ? "border-blue-500 bg-blue-500/20" :
                                        type === 'warning' ? "border-amber-500 bg-amber-500/20" :
                                            "border-red-500 bg-red-500/20"
                                )}
                            >
                                {message || "Your message will appear here..."}
                            </motion.div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <History className="h-3 w-3" />
                            Recent Broadcasts
                        </label>
                        <div className="space-y-2">
                            {recentMessages.slice(0, 5).map(m => (
                                <div key={m.id} className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                m.type === 'info' ? "bg-blue-500" :
                                                    m.type === 'warning' ? "bg-amber-500" : "bg-red-500"
                                            )} />
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">{m.target}</span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">2m ago</span>
                                    </div>
                                    <p className="text-xs truncate text-muted-foreground">{m.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t mt-auto">
                    <Button className="w-full h-11" onClick={handleSend} disabled={!message}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Broadcast
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function LiveTable({ participants, onDetails, onForceSubmit }: {
    participants: LiveParticipant[];
    onDetails: (p: LiveParticipant) => void;
    onForceSubmit: (id: string) => void;
}) {
    return (
        <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b">
                        <tr className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                            <th className="px-4 py-3 text-left w-12">#</th>
                            <th className="px-4 py-3 text-left">Participant</th>
                            <th className="px-4 py-3 text-center">Progress</th>
                            <th className="px-4 py-3 text-center">Est. Score</th>
                            <th className="px-4 py-3 text-center">Time Left</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Alerts</th>
                            <th className="px-4 py-3 text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {participants.map((p, idx) => (
                            <tr key={p.participantId} className="group hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">#{idx + 1}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 rounded-full border border-border/50">
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-black uppercase">
                                                {p.avatarInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold truncate max-w-[150px]">{p.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{p.participantId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                        <div className="flex justify-between w-full text-[10px] font-bold">
                                            <span>{p.answeredCount}/{p.totalQuestions}</span>
                                            <span>{Math.round((p.answeredCount / p.totalQuestions) * 100)}%</span>
                                        </div>
                                        <Progress value={(p.answeredCount / p.totalQuestions) * 100} className="h-1" />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-black text-sm">{p.estimatedScorePercent}%</span>
                                        <span className="text-[9px] text-muted-foreground">Est. {p.estimatedCorrect} correct</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center font-mono text-xs">
                                    {Math.floor(p.timeRemainingSeconds / 60)}:{(p.timeRemainingSeconds % 60).toString().padStart(2, '0')}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold uppercase",
                                        p.status === 'active' ? "text-green-600 bg-green-500/5" :
                                            p.status === 'submitted' ? "text-blue-600 bg-blue-500/5" :
                                                "text-muted-foreground"
                                    )}>
                                        {p.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {p.proctoringAlerts > 0 ? (
                                        <Badge variant="destructive" className="h-5 text-[9px]">{p.proctoringAlerts}</Badge>
                                    ) : <span className="text-muted-foreground/30">—</span>}
                                </td>
                                <td className="px-4 py-4 text-right pr-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onDetails(p)}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => {
                                                if (confirm(`Force-submit quiz for ${p.name}?`)) onForceSubmit(p.participantId);
                                            }}>
                                                <ShieldAlert className="mr-2 h-4 w-4" /> Force Submit
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

function LiveLeaderboard({ participants }: { participants: LiveParticipant[] }) {
    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => b.estimatedScorePercent - a.estimatedScorePercent || b.answeredCount - a.answeredCount);
    }, [participants]);

    const top3 = sortedParticipants.slice(0, 3);
    const others = sortedParticipants.slice(3);

    const chartData = useMemo(() => {
        // Group scores into ranges
        const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
        const counts = [0, 0, 0, 0, 0];
        participants.forEach(p => {
            const score = p.estimatedScorePercent;
            if (score <= 20) counts[0]++;
            else if (score <= 40) counts[1]++;
            else if (score <= 60) counts[2]++;
            else if (score <= 80) counts[3]++;
            else counts[4]++;
        });
        return ranges.map((r, i) => ({ range: r, count: counts[i] }));
    }, [participants]);

    return (
        <div className="space-y-12">
            {/* Podium */}
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 mb-6">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                        Estimated Rankings
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Last updated just now
                    </span>
                </div>

                <div className="flex items-end justify-center gap-4 h-[240px] w-full max-w-4xl px-4">
                    {/* 2nd Place */}
                    {top3[1] && <PodiumCard participant={top3[1]} rank={2} height="h-[180px]" />}
                    {/* 1st Place */}
                    {top3[0] && <PodiumCard participant={top3[0]} rank={1} height="h-[220px]" highlighted />}
                    {/* 3rd Place */}
                    {top3[2] && <PodiumCard participant={top3[2]} rank={3} height="h-[150px]" />}
                </div>
            </div>

            {/* Stats and Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Score Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="range" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={i === 4 ? 'var(--primary)' : 'rgba(var(--primary-rgb), 0.3)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Stats Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Submission Progress</span>
                                <span>{participants.filter(p => p.status === 'submitted').length} / {participants.length}</span>
                            </div>
                            <Progress value={(participants.filter(p => p.status === 'submitted').length / participants.length) * 100} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Avg. Score</span>
                                <div className="text-2xl font-black text-primary">
                                    {Math.round(participants.reduce((s, p) => s + p.estimatedScorePercent, 0) / participants.length)}%
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Top Score</span>
                                <div className="text-2xl font-black text-green-600">
                                    {Math.max(...participants.map(p => p.estimatedScorePercent))}%
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => toast.info("Refresh rankings manual override")}>
                            Refresh Rankings
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Leaderboard Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight">Full Rankings</h3>
                    <Button variant="ghost" size="sm" className="text-primary">Download CSV</Button>
                </div>
                <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b">
                                <tr className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                                    <th className="px-4 py-3 text-left w-20">Rank</th>
                                    <th className="px-4 py-3 text-left">Participant</th>
                                    <th className="px-4 py-3 text-center">Answered</th>
                                    <th className="px-4 py-3 text-center">Est. Correct</th>
                                    <th className="px-4 py-3 text-center">Est. Score</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {sortedParticipants.map((p, i) => (
                                    <tr key={p.participantId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-4 font-mono font-black text-primary">#{i + 1}</td>
                                        <td className="px-4 py-4 font-bold">{p.name}</td>
                                        <td className="px-4 py-4 text-center">{p.answeredCount} / {p.totalQuestions}</td>
                                        <td className="px-4 py-4 text-center text-green-600 font-bold">{p.estimatedCorrect}</td>
                                        <td className="px-4 py-4 text-center font-black">{p.estimatedScorePercent}%</td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                {p.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PodiumCard({ participant, rank, height, highlighted }: {
    participant: LiveParticipant;
    rank: number;
    height: string;
    highlighted?: boolean
}) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
                "relative flex-1 flex flex-col items-center justify-end group",
                highlighted ? "z-10" : "z-0"
            )}
        >
            <div className="absolute -top-12 flex flex-col items-center gap-2">
                <Avatar className={cn(
                    "h-14 w-14 border-4 border-background shadow-xl transition-transform group-hover:scale-110",
                    rank === 1 ? "h-16 w-16" : ""
                )}>
                    <AvatarFallback className={cn(
                        "text-lg font-black bg-primary/10 text-primary uppercase",
                        rank === 1 && "bg-amber-100 text-amber-700"
                    )}>
                        {participant.avatarInitials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black truncate max-w-[100px] text-center">{participant.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{participant.estimatedScorePercent}%</span>
                </div>
            </div>

            <div className={cn(
                "w-full rounded-t-2xl shadow-xl flex flex-col items-center justify-center gap-1 transition-all duration-500",
                height,
                rank === 1 ? "bg-amber-500 shadow-amber-500/20" :
                    rank === 2 ? "bg-slate-400 shadow-slate-400/20" :
                        "bg-orange-600 shadow-orange-600/20"
            )}>
                <span className="text-4xl font-black text-white/50">{rank}</span>
            </div>
        </motion.div>
    );
}

function ParticipantLiveDrawer({
    participant,
    onClose,
    onForceSubmit
}: {
    participant: LiveParticipant | null;
    onClose: () => void;
    onForceSubmit: (id: string) => void;
}) {
    if (!participant) return null;

    return (
        <Sheet open={!!participant} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
                <SheetHeader className="p-6 pb-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-16 w-16 border-2 border-primary/20 p-0.5">
                                    <AvatarFallback className="text-xl font-black bg-primary/10 text-primary uppercase">
                                        {participant.avatarInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background",
                                    participant.status === 'active' ? "bg-green-500" : "bg-muted"
                                )} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black tracking-tight">{participant.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] uppercase">{participant.status}</Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">{participant.participantId}</span>
                                </div>
                            </div>
                        </div>
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </div>

                    <Tabs defaultValue="progress" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50 p-1">
                            <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
                            <TabsTrigger value="answers" className="text-xs">Answers</TabsTrigger>
                            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-auto mt-6 space-y-8 pb-20 px-1">
                            <TabsContent value="progress" className="space-y-8 m-0">
                                <div className="flex items-center justify-center py-8">
                                    <div className="relative h-32 w-32">
                                        <svg className="h-full w-full" viewBox="0 0 36 36">
                                            <path className="text-muted/30" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="text-primary transition-all duration-500" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(participant.answeredCount / participant.totalQuestions) * 100}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black">{participant.answeredCount}/{participant.totalQuestions}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Answered</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <DetailCard label="Est. Correct" value={participant.estimatedCorrect} icon={<ShieldCheck className="h-3 w-3 text-green-500" />} />
                                    <DetailCard label="Est. Score" value={`${participant.estimatedScorePercent}%`} icon={<TrendingUp className="h-3 w-3 text-primary" />} />
                                    <DetailCard label="Alerts" value={participant.proctoringAlerts} icon={<AlertTriangle className="h-3 w-3 text-destructive" />} alert={participant.proctoringAlerts > 0} />
                                    <DetailCard label="Time on Q" value={`${Math.floor(participant.timeOnQuestion / 60)}m ${participant.timeOnQuestion % 60}s`} icon={<Clock className="h-3 w-3 text-amber-500" />} />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Question Preview</label>
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-xs italic leading-relaxed">
                                        "Question {participant.currentQuestion}: What is the primary function of the mitochondria in a eukaryotic cell?"
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="answers" className="space-y-4 m-0">
                                <div className="space-y-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-muted-foreground w-4">Q{i + 1}</span>
                                                <span className="text-xs truncate max-w-[200px]">How does React handle...</span>
                                            </div>
                                            <Badge variant={i < 4 ? 'secondary' : 'outline'} className={cn(
                                                "text-[10px] h-5",
                                                i < 4 ? "bg-green-500/10 text-green-700" : "text-muted-foreground"
                                            )}>
                                                {i < 4 ? 'Option B' : '—'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="events" className="space-y-6 m-0">
                                <div className="relative space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                                    <EventItem time="12:00:01" label="Joined quiz" type="info" />
                                    <EventItem time="12:02:45" label="Answered Q1" type="success" />
                                    <EventItem time="12:05:12" label="Tab switch warning" type="error" />
                                    <EventItem time="12:10:33" label="Answered Q5" type="success" />
                                    <EventItem time="12:15:01" label="Camera warning" type="warning" />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </SheetHeader>

                <SheetFooter className="mt-auto p-6 border-t bg-muted/5 grid grid-cols-2 gap-3">
                    <Button className="bg-[#25D366] hover:bg-[#20ba5a] text-white">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                    </Button>
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Send className="mr-2 h-4 w-4" />
                        Direct Msg
                    </Button>
                    {participant.status === 'active' && (
                        <Button
                            variant="destructive"
                            className="col-span-2 shadow-lg shadow-destructive/10"
                            onClick={() => {
                                if (confirm(`Force-submit quiz for ${participant.name}? Their current answers will be submitted immediately.`)) {
                                    onForceSubmit(participant.participantId);
                                    onClose();
                                }
                            }}
                        >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Force Submit Quiz
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function DetailCard({ label, value, icon, alert }: { label: string; value: string | number; icon: React.ReactNode; alert?: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-xl bg-muted/30 border border-border/50 transition-all",
            alert && "bg-destructive/5 border-destructive/20"
        )}>
            <div className="flex items-center gap-2 mb-1 opacity-70">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className={cn("text-xl font-black", alert && "text-destructive")}>{value}</div>
        </div>
    );
}

function EventItem({ time, label, type }: { time: string; label: string; type: 'info' | 'success' | 'warning' | 'error' }) {
    const dotColor = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        error: 'bg-destructive'
    }[type];

    return (
        <div className="relative pl-8 flex items-center justify-between group">
            <div className={cn("absolute left-1.5 top-1.5 h-2 w-2 rounded-full ring-4 ring-background z-10", dotColor)} />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            <span className="text-[10px] font-mono text-muted-foreground/60">{time}</span>
        </div>
    );
}
