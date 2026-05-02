"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuizStore } from "@/lib/stores/quiz-store";
import { useProctoringStore } from "@/lib/stores/proctoring-store";
import { quizService } from "@/lib/services/quiz-service";
import { QuestionDisplay } from "@/components/quiz/question-display";
import { QuestionNavigation } from "@/components/quiz/question-navigation";
import { useQuizSocket } from "@/lib/hooks/useQuizSocket";
import { ProctoringManager } from "@/components/features/proctoring/ProctoringManager";
import { ProctorWarningModal, type WarningType } from "@/components/features/proctoring/ProctorWarningModal";
import { ProctoringStatusChip } from "@/components/features/proctoring/ProctoringStatusChip";
import { CameraFeed } from "@/components/features/proctoring/CameraFeed";
import { useState } from "react";

export default function LiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.contestId as string;
  const videoRef = useRef<HTMLVideoElement>(null);

  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    type: WarningType;
    count?: number;
  }>({ open: false, type: 'TAB_SWITCH' });

  const {
    session,
    currentQuestionIndex,
    timeRemaining,
    isLoading,
    startQuiz,
    setCurrentQuestion,
    submitQuiz,
    tick,
  } = useQuizStore();

  const { 
    isCameraEnabled, 
    isFullscreen, 
    setFullscreen, 
    recordTabSwitch, 
    recordFullscreenExit,
    tabSwitchCount,
    maxTabSwitches,
    videoStream,
  } = useProctoringStore();

  // Initialize WebSocket for quiz
  const sessionToken = typeof window !== 'undefined' 
    ? sessionStorage.getItem('quizParticipant')
      ? JSON.parse(sessionStorage.getItem('quizParticipant') || '{}').sessionToken
      : ''
    : '';
  
  const participantId = typeof window !== 'undefined' 
    ? sessionStorage.getItem('quizParticipant')
      ? JSON.parse(sessionStorage.getItem('quizParticipant') || '{}').participantId
      : ''
    : '';

  const deviceId = typeof window !== 'undefined' 
    ? localStorage.getItem('deviceId') || crypto.randomUUID()
    : '';

  const { wsStatus } = useQuizSocket(
    contestId,
    participantId,
    sessionToken,
    deviceId,
    {
      onSessionNew: (data) => {
        // Session started
        console.log('[v0] New session', data);
      },
      onSessionRestored: (data) => {
        // Resume from previous session
        console.log('[v0] Session restored', data);
      },
      onProctorWarning: (data) => {
        console.log('[v0] Proctor warning:', data);
        setWarningModal({
          open: true,
          type: data.type,
          count: data.count,
        });
      },
    }
  );

  // Initialize quiz on mount
  useEffect(() => {
    const initQuiz = async () => {
      await startQuiz(contestId, participantId || "demo-participant");
    };
    initQuiz();
  }, [contestId, startQuiz, participantId]);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.fullscreenEnabled && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setFullscreen(true);
        }
      } catch (error) {
        console.error('[v0] Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();
  }, [setFullscreen]);

  // Setup camera preview
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Enter fullscreen
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setFullscreen(true);
        }
      } catch (error) {
        console.error("Failed to enter fullscreen:", error);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setFullscreen(isFs);
      if (!isFs) {
        recordViolation("fullscreen_exit");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [setFullscreen, recordViolation]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== "in_progress") return;

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [session, tick]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && session?.status === "in_progress") {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, session?.status]);

  // Handle tab switch and fullscreen exit
  const handleTabSwitch = () => {
    const isDisqualified = recordTabSwitch();
    if (isDisqualified) {
      setWarningModal({
        open: true,
        type: 'TAB_SWITCH',
        count: maxTabSwitches,
      });
    }
  };

  const handleFullscreenExit = () => {
    recordFullscreenExit();
    setWarningModal({
      open: true,
      type: 'FULLSCREEN_EXIT',
    });
  };

  const handleReturnFullscreen = async () => {
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      }
    } catch (error) {
      console.error('[v0] Failed to return to fullscreen:', error);
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    const result = await submitQuiz();
    if (result) {
      router.push(`/quiz/${contestId}/submitted`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColorClass = () => {
    if (timeRemaining <= 60) return "text-destructive";
    if (timeRemaining <= 300) return "text-warning";
    return "text-foreground";
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
  const answeredCount = session.answers.filter((a) => a.selectedOption !== null).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Proctoring Manager - monitors violations silently */}
      <ProctoringManager
        onTabSwitch={handleTabSwitch}
        onFullscreenExit={handleFullscreenExit}
      />

      {/* Proctor Warning Modal */}
      <ProctorWarningModal
        open={warningModal.open}
        type={warningModal.type}
        warningCount={warningModal.count}
        maxWarnings={maxTabSwitches}
        onDismiss={() => setWarningModal({ ...warningModal, open: false })}
        onReturnFullscreen={handleReturnFullscreen}
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Contest Info */}
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-foreground text-lg hidden sm:block">
              {session.contestId}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Q {currentQuestionIndex + 1}/{session.questions.length}</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">{answeredCount} answered</span>
            </div>
          </div>

          {/* Center: Timer */}
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold
              ${timeRemaining <= 60 ? "bg-destructive/10" : "bg-muted"}
              ${getTimeColorClass()}
            `}
          >
            <Clock className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>

          {/* Right: Camera Preview, Status & Submit */}
          <div className="flex items-center gap-3">
            {/* Mini Camera Preview */}
            {videoStream && (
              <CameraFeed
                stream={videoStream}
                variant="floating"
              />
            )}

            {/* Proctoring Status */}
            <ProctoringStatusChip />

            {/* Submit Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredCount} out of {session.questions.length} questions.
                    {answeredCount < session.questions.length && (
                      <span className="block mt-2 text-warning">
                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                        You still have {session.questions.length - answeredCount} unanswered questions.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    Submit Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 mt-3" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Question Area */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  selectedOption={session.answers[currentQuestionIndex]?.selectedOption ?? null}
                  isMarkedForReview={session.answers[currentQuestionIndex]?.markedForReview ?? false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const store = useQuizStore.getState();
                  store.markForReview(currentQuestionIndex);
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                {session.answers[currentQuestionIndex]?.markedForReview
                  ? "Unmark Review"
                  : "Mark for Review"}
              </Button>

              <Button
                onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === session.questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Navigation Sidebar */}
        <aside className="hidden lg:block w-72 border-l bg-card p-4 overflow-auto">
          <QuestionNavigation
            questions={session.questions}
            answers={session.answers}
            currentIndex={currentQuestionIndex}
            onNavigate={setCurrentQuestion}
          />
        </aside>
      </main>

      {/* Mobile Question Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {session.questions.map((_, index) => {
            const answer = session.answers[index];
            const isAnswered = answer?.selectedOption !== null;
            const isMarked = answer?.markedForReview;
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-colors
                  ${isCurrent ? "ring-2 ring-primary" : ""}
                  ${isAnswered && !isMarked ? "bg-success text-success-foreground" : ""}
                  ${isMarked ? "bg-warning text-warning-foreground" : ""}
                  ${!isAnswered && !isMarked ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
