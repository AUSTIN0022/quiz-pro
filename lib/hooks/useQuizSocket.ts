'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuizStore } from '@/lib/stores/quiz-store';

interface QuizSocketCallbacks {
  onSessionNew?: (data: any) => void;
  onSessionRestored?: (data: any) => void;
  onAnswerSaved?: (data: { questionIndex: number; status: string }) => void;
  onTimerSync?: (data: { timeRemaining: number }) => void;
  onAutoSubmitWarning?: () => void;
  onQuizSubmitted?: () => void;
  onProctorWarning?: (data: any) => void;
  onAdminBroadcast?: (data: any) => void;
  onSessionClosed?: () => void;
}

export type WSStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useQuizSocket(
  contestId: string,
  participantId: string,
  sessionToken: string,
  deviceId: string,
  callbacks?: Partial<QuizSocketCallbacks>
) {
  const socketRef = useRef<Socket | null>(null);
  const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
  const quizStore = useQuizStore();
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // Connect event
    socket.on('connect', () => {
      console.log('[v0] Quiz WebSocket connected');
      setWsStatus('connected');

      // Join quiz
      socket.emit('JOIN_QUIZ', {
        contestId,
        participantId,
        deviceId,
        sessionToken,
        timestamp: new Date().toISOString(),
      });

      // Start ping interval
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        socket.emit('PING', {
          timestamp: new Date().toISOString(),
        });
      }, 30000);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log('[v0] Quiz WebSocket disconnected');
      setWsStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    });

    // Reconnecting event
    socket.on('reconnect_attempt', () => {
      console.log('[v0] Quiz WebSocket reconnecting...');
      setWsStatus('reconnecting');
    });

    // Session new (fresh quiz)
    socket.on('SESSION_NEW', (data: any) => {
      console.log('[v0] New quiz session');
      quizStore.setQuestions(data.questions);
      quizStore.setTimeRemaining(data.timeRemaining);
      callbacks?.onSessionNew?.(data);
    });

    // Session restored (resume)
    socket.on('SESSION_RESTORED', (data: any) => {
      console.log('[v0] Session restored');
      quizStore.hydrateFromSession(data);
      callbacks?.onSessionRestored?.(data);
    });

    // Answer saved
    socket.on('ANSWER_SAVED', (data: { questionIndex: number; status: string }) => {
      console.log('[v0] Answer saved for question', data.questionIndex);
      callbacks?.onAnswerSaved?.(data);
    });

    // Timer sync (prevent drift)
    socket.on('TIMER_SYNC', (data: { timeRemaining: number }) => {
      quizStore.setTimeRemaining(data.timeRemaining);
      callbacks?.onTimerSync?.(data);
    });

    // Auto-submit warning
    socket.on('AUTO_SUBMIT_WARNING', () => {
      console.log('[v0] Auto-submit warning');
      callbacks?.onAutoSubmitWarning?.();
    });

    // Quiz submitted
    socket.on('QUIZ_SUBMITTED', () => {
      console.log('[v0] Quiz submitted successfully');
      quizStore.setQuizState('SUBMITTED');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      callbacks?.onQuizSubmitted?.();
    });

    // Proctor warning
    socket.on('PROCTOR_WARNING', (data: any) => {
      console.log('[v0] Proctor warning:', data);
      callbacks?.onProctorWarning?.(data);
    });

    // Admin broadcast
    socket.on('ADMIN_BROADCAST', (data: any) => {
      console.log('[v0] Admin broadcast:', data);
      callbacks?.onAdminBroadcast?.(data);
    });

    // Session closed (multi-device conflict)
    socket.on('SESSION_CLOSED', () => {
      console.log('[v0] Session closed on another device');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      callbacks?.onSessionClosed?.();
    });

    // Pong response
    socket.on('PONG', (data: { timestamp: string }) => {
      const latency = Date.now() - new Date(data.timestamp).getTime();
      console.log(`[v0] Quiz WebSocket latency: ${latency}ms`);
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('[v0] Quiz WebSocket error:', error);
      setWsStatus('disconnected');
    });

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      socket.disconnect();
    };
  }, [contestId, participantId, sessionToken, deviceId, quizStore, callbacks]);

  // Emit answer question
  const emitAnswer = (questionIndex: number, optionIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit('ANSWER_QUESTION', {
        contestId,
        participantId,
        questionIndex,
        optionIndex,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Emit navigate question
  const emitNavigate = (questionIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit('NAVIGATE_QUESTION', {
        contestId,
        participantId,
        questionIndex,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Emit submit quiz
  const emitSubmit = (source: 'MANUAL' | 'AUTO' = 'MANUAL') => {
    if (socketRef.current) {
      socketRef.current.emit('SUBMIT_QUIZ', {
        contestId,
        participantId,
        source,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Emit proctor warning
  const emitProctorWarning = (type: string) => {
    if (socketRef.current) {
      socketRef.current.emit('PROCTOR_WARNING', {
        contestId,
        participantId,
        type,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return {
    socket: socketRef.current,
    wsStatus,
    emitAnswer,
    emitNavigate,
    emitSubmit,
    emitProctorWarning,
  };
}
