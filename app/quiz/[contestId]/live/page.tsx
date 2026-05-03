"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Stores & Hooks
import { useQuizStore } from "@/lib/stores/quiz-store";
import { useProctoringStore } from "@/lib/stores/proctoring-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuizSocket } from "@/lib/hooks/useQuizSocket";
import { useAnswerHandler } from "@/lib/hooks/useAnswerHandler";
import { useQuizTimer } from "@/lib/hooks/useQuizTimer";
import { useSwipeNavigation } from "@/lib/hooks/useSwipeNavigation";

// Components
import { ProctoringManager } from "@/components/features/proctoring/ProctoringManager";
import { ProctorWarningModal, type WarningType, FlaggedBanner } from "@/components/features/proctoring/ProctorWarningModal";
import { FullscreenReturnOverlay } from "@/components/features/proctoring/FullscreenReturnOverlay";
import { QuizTopBar } from "@/components/features/quiz/QuizTopBar";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { OptionButton } from "@/components/features/quiz/OptionButton";
import { QuizRightPanel } from "@/components/features/quiz/QuizRightPanel";
import { MobileQuizNavigatorSheet } from "@/components/features/quiz/MobileQuizNavigatorSheet";
import { HintButton } from "@/components/features/quiz/HintButton";
import { FlagButton } from "@/components/features/quiz/FlagButton";
import { SubmitConfirmModal } from "@/components/features/quiz/SubmitConfirmModal";
import { AutoSubmitModal } from "@/components/features/quiz/AutoSubmitModal";
import { QuizLoadingScreen } from "@/components/features/quiz/QuizLoadingScreen";
import { QuizSubmittingScreen } from "@/components/features/quiz/QuizSubmittingScreen";

// Services & Utils
import { contestService } from "@/lib/services/contest-service";
import type { Contest } from "@/lib/types";
import { getSocket } from "@/lib/ws-client";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function LiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.contestId as string;

  // Auth
  const sessionToken = useAuthStore((s) => s.sessionToken) || "";
  const participantId = useAuthStore((s) => s.participantId) || "";

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);

  // Quiz store
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentQuestionIndex);
  const answers = useQuizStore((s) => s.answers);
  const quizState = useQuizStore((s) => s.quizState);
  const setCurrentQuestion = useQuizStore((s) => s.setCurrentQuestion);
  const visitQuestion = useQuizStore((s) => s.visitQuestion);
  const setContestContext = useQuizStore((s) => s.setContestContext);

  // Proctoring store
  const {
    isFullscreen,
    setFullscreen,
    totalWarnings,
    maxTabSwitches,
  } = useProctoringStore();

  // Local state
  const [contest, setContest] = useState<Contest | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    type: WarningType;
  }>({ open: false, type: "TAB_SWITCH" });

  // ─── WS Connection ─────────────────────────────
  const { emitAnswer, emitSubmit, emitFlag, emitProctoringWarning } = useQuizSocket(
    contestId,
    participantId,
    sessionToken
  );

  // ─── Answer Handler ────────────────────────────
  const { handleAnswer, confirmAnswer, flushPendingAnswers } = useAnswerHandler(emitAnswer);

  // Listen for events
  useEffect(() => {
    const handleAnswerConfirmed = (e: Event) => confirmAnswer((e as CustomEvent<number>).detail);
    const handleProctorWarning = (e: Event) => {
      const data = (e as CustomEvent).detail;
      setWarningModal({ open: true, type: data.warningType as WarningType });
    };

    window.addEventListener('answer-confirmed', handleAnswerConfirmed);
    window.addEventListener('proctor-warning-from-server', handleProctorWarning);
    
    return () => {
      window.removeEventListener('answer-confirmed', handleAnswerConfirmed);
      window.removeEventListener('proctor-warning-from-server', handleProctorWarning);
    };
  }, [confirmAnswer]);

  // Sync answers on reconnect
  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', flushPendingAnswers);
    return () => { socket.off('connect', flushPendingAnswers); };
  }, [flushPendingAnswers]);

  // ─── Timer Hook ────────────────────────────────
  const { timeRemaining } = useQuizTimer(
    // onTimerExpiry
    () => setShowAutoSubmitModal(true),
    // onAutoSubmitWarning
    () => { /* ignore */ }
  );

  // ─── Navigation ────────────────────────────────
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentQuestion(currentIndex - 1);
  }, [currentIndex, setCurrentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentQuestion(next);
      visitQuestion(next);
    }
  }, [currentIndex, questions.length, setCurrentQuestion, visitQuestion]);

  // ─── Swipe Navigation ──────────────────────────
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation(handleNext, handlePrevious, true);

  // ─── Init on mount ─────────────────────────────
  useEffect(() => {
    contestService.getContestById(contestId).then((res) => {
      if (res.success && res.data) setContest(res.data);
    });
    setContestContext("", "", contestId, participantId);
    visitQuestion(0);
  }, [contestId, participantId, setContestContext, visitQuestion]);

  // ─── Proctoring handlers ───────────────────────
  const handleReturnFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } catch { /* ignore */ }
  };

  // ─── Submit handlers ───────────────────────────
  const handleManualSubmit = () => emitSubmit("MANUAL");
  const handleAutoSubmit = () => emitSubmit("AUTO");

  // ─── Current question ──────────────────────────
  const currentQuestion = questions[currentIndex];

  // ─── Loading / Submitting screens ──────────────
  if (quizState === "LOADING" || quizState === "IDLE" || questions.length === 0) {
    return <QuizLoadingScreen />;
  }

  if (quizState === "SUBMITTING") {
    return <QuizSubmittingScreen />;
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-950 text-white">
      {/* ─── Proctoring Engine ────────────────────── */}
      <ProctoringManager
        emitProctoringWarning={emitProctoringWarning}
        videoRef={videoRef}
      />

      {/* ─── Modals & Overlays ────────────────────── */}
      <FlaggedBanner />
      
      <FullscreenReturnOverlay 
        isVisible={!isFullscreen} 
        onReturn={handleReturnFullscreen} 
      />

      <ProctorWarningModal
        open={warningModal.open}
        type={warningModal.type}
        warningCount={totalWarnings}
        maxWarnings={maxTabSwitches}
        onDismiss={() => setWarningModal({ ...warningModal, open: false })}
      />

      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleManualSubmit}
      />

      <AutoSubmitModal
        open={showAutoSubmitModal}
        onAutoSubmit={handleAutoSubmit}
      />

      {/* ─── Top Bar ──────────────────────────────── */}
      <QuizTopBar
        contestTitle={contest?.title || "Quiz"}
        onSubmitClick={() => setShowSubmitModal(true)}
      />

      {/* ─── Main Quiz Area ───────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Invisible Video for Face Detection */}
        <video ref={videoRef} className="hidden" />

        {/* Left: Question + Options */}
        <main 
          className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                />

                <div className="flex flex-col gap-3 mt-8">
                  {currentQuestion.options.map((option, i) => (
                    <OptionButton
                      key={option.index}
                      option={option}
                      optionLabel={OPTION_LABELS[i] || String(i)}
                      isSelected={answers[currentIndex] === option.index}
                      onClick={() => handleAnswer(currentIndex, option.index)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
                  <HintButton question={currentQuestion} questionIndex={currentIndex} />
                  <FlagButton questionIndex={currentIndex} emitFlag={emitFlag} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="hidden sm:flex gap-4 mt-12">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 border-white/10 text-white/50 hover:bg-white/5 h-12 rounded-xl"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="flex-1 border-white/10 text-white/50 hover:bg-white/5 h-12 rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        </main>

        <QuizRightPanel onSubmitClick={() => setShowSubmitModal(true)} />
      </div>

      <MobileQuizNavigatorSheet onSubmitClick={() => setShowSubmitModal(true)} />

      <div className="sm:hidden grid grid-cols-2 gap-3 p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-md">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="border-white/10 h-11 rounded-xl">
          Prev
        </Button>
        <Button variant="outline" onClick={handleNext} disabled={currentIndex === questions.length - 1} className="border-white/10 h-11 rounded-xl">
          Next
        </Button>
      </div>
    </div>
  );
}
