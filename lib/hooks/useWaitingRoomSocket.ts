'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WS } from '@/lib/constants/WS_EVENTS';
import { getSocket, connectSocket } from '@/lib/ws-client';

// ============================================
// Types
// ============================================

export type WsStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface BroadcastMessage {
  type: 'info' | 'warning' | 'urgent';
  text: string;
  timestamp: number;
}

// ============================================
// Seed mode
// ============================================
const USE_SEED_WS = process.env.NEXT_PUBLIC_USE_SEED_WS === 'true' || true;

// ============================================
// Hook
// ============================================

export function useWaitingRoomSocket(
  contestId: string,
  participantId: string,
  sessionToken: string
) {
  const router = useRouter();
  const [participantCount, setParticipantCount] = useState(0);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const [broadcastMessage, setBroadcastMessage] = useState<BroadcastMessage | null>(null);
  const [showStartingOverlay, setShowStartingOverlay] = useState(false);
  const [contestStartTime, setContestStartTime] = useState<Date | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── SEED MODE ────────────────────────────────
  useEffect(() => {
    if (!USE_SEED_WS) return;

    setWsStatus('connected');

    // Initial count after 500ms
    const initTimer = setTimeout(() => {
      setParticipantCount(847);
    }, 500);

    // Random ±5 variation every 3s
    seedIntervalRef.current = setInterval(() => {
      setParticipantCount((prev) => {
        const delta = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(0, prev + delta);
      });
    }, 3000);

    // Dev shortcut: Ctrl+Shift+S to simulate contest start
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowStartingOverlay(true);
        setTimeout(() => {
          router.push(`/quiz/${contestId}/live`);
        }, 1800);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(initTimer);
      if (seedIntervalRef.current) clearInterval(seedIntervalRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contestId, router]);

  // ─── REAL WS MODE ─────────────────────────────
  useEffect(() => {
    if (USE_SEED_WS) return;

    connectSocket(sessionToken);
    const socket = getSocket();

    socket.on('connect', () => {
      setWsStatus('connected');
      socket.emit(WS.JOIN_WAITING_ROOM, { contestId, participantId, sessionToken });

      pingIntervalRef.current = setInterval(() => {
        socket.emit(WS.PING, { timestamp: Date.now() });
      }, 30000);
    });

    socket.on('disconnect', () => {
      setWsStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    });

    socket.io.on('reconnect_attempt', () => {
      setWsStatus('reconnecting');
    });

    socket.on(WS.WAITING_ROOM_COUNT, (data: { count: number }) => {
      setParticipantCount(data.count);
    });

    socket.on(WS.CONTEST_STARTED, () => {
      setShowStartingOverlay(true);
      setTimeout(() => {
        router.push(`/quiz/${contestId}/live`);
      }, 1800);
    });

    socket.on(WS.CONTEST_DELAYED, (data: { newStartTime: string; reason: string }) => {
      setContestStartTime(new Date(data.newStartTime));
    });

    socket.on(WS.ADMIN_BROADCAST, (msg: BroadcastMessage) => {
      setBroadcastMessage(msg);
    });

    return () => {
      socket.off(WS.WAITING_ROOM_COUNT);
      socket.off(WS.CONTEST_STARTED);
      socket.off(WS.CONTEST_DELAYED);
      socket.off(WS.ADMIN_BROADCAST);
      socket.off('connect');
      socket.off('disconnect');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [contestId, participantId, sessionToken, router]);

  const clearBroadcast = useCallback(() => setBroadcastMessage(null), []);

  return {
    participantCount,
    wsStatus,
    broadcastMessage,
    clearBroadcast,
    showStartingOverlay,
    setShowStartingOverlay,
    contestStartTime,
  };
}
