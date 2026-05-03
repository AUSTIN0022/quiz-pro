'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type Socket } from 'socket.io-client';
import { WS } from '@/lib/constants/WS_EVENTS';
import { getSocket, connectSocket, getDeviceId } from '@/lib/ws-client';
import {
  useQuizStore,
  type SessionNewPayload,
  type SessionRestoredPayload,
  type QuizSubmittedPayload,
} from '@/lib/stores/quiz-store';
import questionsData from '@/seed/questions.json';

// ============================================
// Seed mode flag
// ============================================
const USE_SEED_WS = process.env.NEXT_PUBLIC_USE_SEED_WS === 'true' || true; // default true for dev

// ============================================
// Server→Client payload types
// ============================================

interface AnswerSavedPayload {
  questionIndex: number;
  status: 'saved' | 'error';
}

interface TimerSyncPayload {
  timeRemaining: number;
}

interface AutoSubmitWarningPayload {
  secondsLeft: number;
}

interface ProctorWarningAckPayload {
  warningType: string;
  acknowledged: boolean;
  totalWarnings: number;
}

// ============================================
// Hook
// ============================================

export function useQuizSocket(
  contestId: string,
  participantId: string,
  sessionToken: string
) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const store = useQuizStore;

  // ─── SEED MODE ────────────────────────────────
  useEffect(() => {
    if (!USE_SEED_WS) return;

    const seedTimer = setTimeout(() => {
      const storeState = store.getState();

      if (storeState.sessionId && storeState.questions.length > 0) {
        // SESSION_RESTORED
        store.getState().setQuizState('ACTIVE');
        store.getState().setWsStatus('connected');
      } else {
        // SESSION_NEW
        const seedQuestions = (questionsData as Record<string, unknown>[]).map((q, i) => ({
          id: (q.id as string) || `q-${i}`,
          index: i,
          text: (q.text as string) || `Question ${i + 1}`,
          options: ((q.options as { id: string; text: string }[]) || []).map((o, oi) => ({
            index: oi,
            text: o.text,
          })),
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          hint: undefined,
          marks: (q.marks as number) || 4,
          negativeMarks: (q.negativeMarks as number) || 1,
        }));

        const payload: SessionNewPayload = {
          sessionId: `seed-session-${Date.now()}`,
          questions: seedQuestions,
          timeRemaining: 90 * 60,
          totalQuestions: seedQuestions.length,
        };

        store.getState().setQuestions(payload.questions);
        store.getState().setTimeRemaining(payload.timeRemaining);
        store.getState().setSessionId(payload.sessionId);
        store.getState().setQuizState('ACTIVE');
        store.getState().setWsStatus('connected');
      }
    }, 200);

    // Timer decrement every second
    seedTimerRef.current = setInterval(() => {
      store.getState().decrementTimer();
      const remaining = store.getState().timeRemaining;

      if (remaining === 30) {
        window.dispatchEvent(new CustomEvent('auto-submit-warning', { detail: 30 }));
      }

      if (remaining <= 0) {
        store.getState().setQuizState('SUBMITTING');
        setTimeout(() => {
          store.getState().setQuizState('SUBMITTED');
          store.getState().setSubmissionId(`sub-seed-${Date.now()}`);
        }, 300);
      }
    }, 1000);

    return () => {
      clearTimeout(seedTimer);
      if (seedTimerRef.current) clearInterval(seedTimerRef.current);
    };
  }, [contestId, participantId, sessionToken, store]);

  // ─── REAL WS MODE ─────────────────────────────
  useEffect(() => {
    if (USE_SEED_WS) return;

    const socket = getSocket();
    socketRef.current = socket;
    connectSocket(sessionToken);

    socket.on('connect', () => {
      store.getState().setWsStatus('connected');
      socket.emit(WS.JOIN_QUIZ, {
        contestId,
        participantId,
        deviceId: getDeviceId(),
        sessionToken,
      });
      pingIntervalRef.current = setInterval(() => {
        socket.emit(WS.PING, { timestamp: Date.now() });
      }, 30000);
    });

    socket.on('disconnect', () => {
      store.getState().setWsStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    });

    socket.io.on('reconnect_attempt', () => {
      store.getState().setWsStatus('reconnecting');
    });

    socket.on(WS.SESSION_NEW, (data: SessionNewPayload) => {
      store.getState().setQuestions(data.questions);
      store.getState().setTimeRemaining(data.timeRemaining);
      store.getState().setSessionId(data.sessionId);
      store.getState().setQuizState('ACTIVE');
    });

    socket.on(WS.SESSION_RESTORED, (data: SessionRestoredPayload) => {
      store.getState().hydrateFromSession(data);
      const nextQ = findNextUnanswered(data.answers, data.resumeFromIndex, data.totalQuestions);
      store.getState().setCurrentQuestion(nextQ);
      store.getState().setQuizState('ACTIVE');
    });

    socket.on(WS.SESSION_CLOSED, () => {
      store.getState().setQuizState('IDLE');
      router.push(`/quiz/${contestId}/conflict`);
    });

    socket.on(WS.ANSWER_SAVED, (data: AnswerSavedPayload) => {
      if (data.status === 'saved') {
        window.dispatchEvent(new CustomEvent('answer-confirmed', { detail: data.questionIndex }));
      } else {
        const answer = store.getState().answers[data.questionIndex];
        if (answer !== undefined) {
          socket.emit(WS.ANSWER_QUESTION, {
            questionIndex: data.questionIndex,
            optionIndex: answer,
            contestId,
            participantId,
          });
        }
      }
    });

    socket.on(WS.TIMER_SYNC, (data: TimerSyncPayload) => {
      store.getState().setTimeRemaining(data.timeRemaining);
    });

    socket.on(WS.AUTO_SUBMIT_WARNING, (data: AutoSubmitWarningPayload) => {
      window.dispatchEvent(new CustomEvent('auto-submit-warning', { detail: data.secondsLeft }));
    });

    socket.on(WS.QUIZ_SUBMITTED, (data: QuizSubmittedPayload) => {
      store.getState().setQuizState('SUBMITTED');
      store.getState().setSubmissionId(data.submissionId);
      router.push(`/quiz/${contestId}/submitted`);
    });

    socket.on(WS.PROCTOR_WARNING_ACK, (data: ProctorWarningAckPayload) => {
      window.dispatchEvent(new CustomEvent('proctor-warning-from-server', { detail: data }));
    });

    return () => {
      socket.off(WS.SESSION_NEW);
      socket.off(WS.SESSION_RESTORED);
      socket.off(WS.SESSION_CLOSED);
      socket.off(WS.ANSWER_SAVED);
      socket.off(WS.TIMER_SYNC);
      socket.off(WS.AUTO_SUBMIT_WARNING);
      socket.off(WS.QUIZ_SUBMITTED);
      socket.off(WS.PROCTOR_WARNING_ACK);
      socket.off('connect');
      socket.off('disconnect');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [contestId, participantId, sessionToken, router, store]);

  // ═══════════════════════════════════════════════
  // TYPED EMIT FUNCTIONS
  // ═══════════════════════════════════════════════

  const emitAnswer = useCallback(
    (questionIndex: number, optionIndex: number) => {
      if (USE_SEED_WS) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('answer-confirmed', { detail: questionIndex }));
        }, 50);
        return;
      }
      socketRef.current?.emit(WS.ANSWER_QUESTION, { questionIndex, optionIndex, contestId, participantId });
    },
    [contestId, participantId]
  );

  const emitFlag = useCallback(
    (questionIndex: number, flagged: boolean) => {
      if (USE_SEED_WS) return;
      socketRef.current?.emit(WS.FLAG_QUESTION, { questionIndex, flagged, contestId, participantId });
    },
    [contestId, participantId]
  );

  const emitSubmit = useCallback(
    (source: 'MANUAL' | 'AUTO') => {
      store.getState().setQuizState('SUBMITTING');
      if (USE_SEED_WS) {
        setTimeout(() => {
          store.getState().setQuizState('SUBMITTED');
          store.getState().setSubmissionId(`sub-seed-${Date.now()}`);
          router.push(`/quiz/${contestId}/submitted`);
        }, 300);
        return;
      }
      socketRef.current?.emit(WS.SUBMIT_QUIZ, {
        contestId,
        participantId,
        source,
        answers: store.getState().answers,
      });
    },
    [contestId, participantId, router, store]
  );

  const emitProctoringWarning = useCallback(
    (warningType: string) => {
      if (USE_SEED_WS) return;
      socketRef.current?.emit(WS.PROCTOR_WARNING, {
        warningType,
        contestId,
        participantId,
        timestamp: Date.now(),
      });
    },
    [contestId, participantId]
  );

  return { emitAnswer, emitFlag, emitSubmit, emitProctoringWarning };
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function findNextUnanswered(
  answers: Record<number, number>,
  resumeFromIndex: number,
  total: number
): number {
  for (let i = resumeFromIndex; i < total; i++) {
    if (answers[i] === undefined) return i;
  }
  return Math.max(0, total - 1);
}
