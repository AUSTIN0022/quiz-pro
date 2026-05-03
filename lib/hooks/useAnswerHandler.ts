'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useQuizStore } from '@/lib/stores/quiz-store';

// ═══════════════════════════════════════════════════════
// useAnswerHandler — Optimistic updates + WS + retry
// ═══════════════════════════════════════════════════════

export function useAnswerHandler(
  emitAnswer: (qi: number, oi: number) => void
) {
  const setAnswer = useQuizStore((s) => s.setAnswer);
  const visitQuestion = useQuizStore((s) => s.visitQuestion);
  const answersRef = useRef<Record<number, number>>({});

  // Synchronize ref with store for retry logic
  useEffect(() => {
    const unsubscribe = useQuizStore.subscribe((state) => {
      answersRef.current = state.answers;
    });
    return unsubscribe;
  }, []);

  // Track pending confirmations: Map<questionIndex, timeout>
  const pendingRef = useRef<Map<number, number>>(new Map());

  const handleAnswer = useCallback(
    (questionIndex: number, optionIndex: number) => {
      // 1. OPTIMISTIC UPDATE
      setAnswer(questionIndex, optionIndex);
      visitQuestion(questionIndex);

      // 2. WS EMIT
      emitAnswer(questionIndex, optionIndex);

      // 3. RETRY TIMEOUT (5 seconds)
      const existingTimeout = pendingRef.current.get(questionIndex);
      if (existingTimeout) window.clearTimeout(existingTimeout);

      const timeout = window.setTimeout(() => {
        // Re-emit current answer for this index
        const currentOption = answersRef.current[questionIndex];
        if (currentOption !== undefined) {
          emitAnswer(questionIndex, currentOption);
        }
        pendingRef.current.delete(questionIndex);
      }, 5000);

      pendingRef.current.set(questionIndex, timeout);
    },
    [emitAnswer, setAnswer, visitQuestion]
  );

  // Call when ANSWER_SAVED received
  const confirmAnswer = useCallback((questionIndex: number) => {
    const timeout = pendingRef.current.get(questionIndex);
    if (timeout) {
      window.clearTimeout(timeout);
      pendingRef.current.delete(questionIndex);
    }
  }, []);

  // On reconnect: flush all answers
  const flushPendingAnswers = useCallback(() => {
    const { answers } = useQuizStore.getState();
    Object.entries(answers).forEach(([qi, oi]) => {
      emitAnswer(Number(qi), Number(oi));
    });
  }, [emitAnswer]);

  // Cleanup
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return { handleAnswer, confirmAnswer, flushPendingAnswers };
}
