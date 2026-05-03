'use client';

import { useEffect, useRef } from 'react';
import { useQuizStore } from '@/lib/stores/quiz-store';

// ═══════════════════════════════════════════════════════
// useQuizTimer — Core countdown logic + sync
// ═══════════════════════════════════════════════════════

export function useQuizTimer(
  onTimerExpiry: () => void,
  onAutoSubmitWarning: (secondsLeft: number) => void
) {
  const timeRemaining = useQuizStore((s) => s.timeRemaining);
  const quizState = useQuizStore((s) => s.quizState);
  const decrementTimer = useQuizStore((s) => s.decrementTimer);
  const setTimeRemaining = useQuizStore((s) => s.setTimeRemaining);
  
  const intervalRef = useRef<number | null>(null);
  const warningFired = useRef(false);

  // 1. Start/Stop interval
  useEffect(() => {
    if (quizState !== 'ACTIVE') {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [quizState, decrementTimer]);

  // 2. React to timer values
  useEffect(() => {
    if (quizState !== 'ACTIVE') return;

    // Auto-submit warning at 30 seconds
    if (timeRemaining === 30 && !warningFired.current) {
      warningFired.current = true;
      onAutoSubmitWarning(30);
    }

    // Reset warning if timer jumps back up (sync)
    if (timeRemaining > 30) {
      warningFired.current = false;
    }

    // Expiry
    if (timeRemaining <= 0) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      onTimerExpiry();
    }
  }, [timeRemaining, quizState, onTimerExpiry, onAutoSubmitWarning]);

  // 3. Page Visibility — Background correction
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const { timerStartedAt, timeRemaining: storedTime } = useQuizStore.getState();
        if (timerStartedAt) {
          const elapsedSeconds = Math.floor((Date.now() - timerStartedAt) / 1000);
          const correctedTime = Math.max(0, storedTime - elapsedSeconds);
          // If the deviation is significant (> 2s), sync it
          if (Math.abs(correctedTime - timeRemaining) > 2) {
             setTimeRemaining(correctedTime);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timeRemaining, setTimeRemaining]);

  return { timeRemaining };
}
