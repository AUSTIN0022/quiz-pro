"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Share2,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/stores/quiz-store";
import { useProctoringStore } from "@/lib/stores/proctoring-store";

// ═══════════════════════════════════════════════════════
// SUBMITTED PAGE
// ═══════════════════════════════════════════════════════
export default function SubmittedPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data from state or query or store
  const submissionId = searchParams.get("id") || "SUB-" + Math.random().toString(36).slice(2, 9).toUpperCase();
  const reason = searchParams.get("reason");
  
  const questions = useQuizStore((s) => s.questions);
  const answers = useQuizStore((s) => s.answers);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const resetProctoring = useProctoringStore((s) => s.reset);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  // ─── Cleanup on Mount ───────────────────────────
  useEffect(() => {
    // Reset proctoring (stops camera tracks and resets state)
    resetProctoring();
    
    // Set state
    useQuizStore.getState().setQuizState("SUBMITTED");

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Confetti logic could go here or as components
  }, [resetProctoring]);

  if (reason === 'CONTEST_ENDED') {
    return <ContestEndedScreen />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center p-4 sm:p-8" style={{ background: "linear-gradient(135deg, #0F2040 0%, #0D1117 100%)" }}>
      
      {/* Confetti */}
      <ConfettiBurst />

      <div className="max-w-xl w-full space-y-6 z-10">
        
        {/* CARD 1: Confirmation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center"
        >
          {/* Success Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Submitted!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/70 text-sm"
          >
            Your answers have been recorded successfully.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 font-mono text-[10px] text-white/40 uppercase tracking-widest"
          >
            at {new Date().toLocaleTimeString()} {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </motion.div>
        </motion.div>

        {/* CARD 2: Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Attempted" value={`${answeredCount}/${total}`} delay={0.9} />
          <StatCard label="Time Taken" value="47m 23s" delay={1.0} />
          <StatCard label="Submission ID" value={submissionId} delay={1.1} isMono />
        </div>

        {/* CARD 3: Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white/5 border border-white/5 rounded-3xl p-8"
        >
          <div className="space-y-8 relative">
            {/* Dashed line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px border-l border-dashed border-white/20" />
            
            <TimelineStep 
              icon={<Loader2 className="w-3 h-3 text-white animate-spin" />}
              title="Answers evaluated by our system"
              status="Processing"
              isActive
            />
            <TimelineStep 
              icon={<Clock className="w-3 h-3 text-white/40" />}
              title="Results published by 12th April"
              status="Pending"
            />
            <TimelineStep 
              icon={<Award className="w-3 h-3 text-white/40" />}
              title="Certificate issued (if eligible)"
              status="Pending"
            />
          </div>

          <p className="mt-8 text-[10px] text-white/40 text-center uppercase tracking-widest font-medium">
            You'll be notified on WhatsApp when results are ready.
          </p>
        </motion.div>

        {/* CTA CARD */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col gap-3"
        >
          <Button className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-white/90 font-bold flex items-center justify-center gap-2">
            Explore more contests
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-sm text-white/60">Share this contest</span>
            <div className="flex gap-2">
              <SocialIcon color="bg-green-500/20 text-green-400" />
              <SocialIcon color="bg-blue-500/20 text-blue-400" />
              <SocialIcon color="bg-white/10 text-white" />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

function StatCard({ label, value, delay, isMono }: { label: string; value: string; delay: number; isMono?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 border border-white/5 rounded-2xl p-5"
    >
      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className={`text-white text-lg font-bold truncate ${isMono ? 'font-mono text-sm' : ''}`}>{value}</p>
    </motion.div>
  );
}

function TimelineStep({ icon, title, status, isActive }: { icon: React.ReactNode; title: string; status: string; isActive?: boolean }) {
  return (
    <div className="flex gap-4 relative z-10">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isActive ? 'bg-orange-500 border-orange-400' : 'bg-white/5 border-white/10'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/40'}`}>{title}</p>
        <p className="text-[10px] text-white/30 uppercase tracking-tighter">{status}</p>
      </div>
    </div>
  );
}

function SocialIcon({ color }: { color: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${color}`}>
      <Share2 className="w-3.5 h-3.5" />
    </div>
  );
}

function ConfettiBurst() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const count = 40;
    const colors = ["#F97316", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EC4899"];
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
    
    const timer = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{ 
              scale: 1, 
              x: p.x * 4, 
              y: p.y * 4, 
              rotate: p.rotation,
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
            className="absolute"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ContestEndedScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "#0F172A" }}>
      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Contest Has Ended</h1>
      <p className="text-white/60 mb-8 max-w-sm">
        This contest ended before you could submit answers. You were not able to participate in this session.
      </p>
      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
        Browse Other Contests
      </Button>
    </div>
  );
}
