'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WaitingRoomSocketEvents {
  onParticipantCountChange: (count: number) => void;
  onContestStarted: () => void;
  onContestDelayed: (newStartTime: string) => void;
  onAdminBroadcast: (message: { type: string; text: string }) => void;
}

export type WSStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useWaitingRoomSocket(
  contestId: string,
  participantId: string,
  callbacks?: Partial<WaitingRoomSocketEvents>
) {
  const socketRef = useRef<Socket | null>(null);
  const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
  const reconnectAttemptRef = useRef(0);
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
      console.log('[v0] WebSocket connected');
      setWsStatus('connected');
      reconnectAttemptRef.current = 0;

      // Join waiting room
      socket.emit('JOIN_WAITING_ROOM', {
        contestId,
        participantId,
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
      console.log('[v0] WebSocket disconnected');
      setWsStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    });

    // Reconnecting event
    socket.on('reconnect_attempt', () => {
      console.log('[v0] WebSocket reconnecting...');
      setWsStatus('reconnecting');
      reconnectAttemptRef.current++;
    });

    // Participant count update
    socket.on('WAITING_ROOM_COUNT', (data: { count: number }) => {
      callbacks?.onParticipantCountChange?.(data.count);
    });

    // Contest started
    socket.on('CONTEST_STARTED', () => {
      console.log('[v0] Contest started');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      callbacks?.onContestStarted?.();
    });

    // Contest delayed
    socket.on('CONTEST_DELAYED', (data: { newStartTime: string }) => {
      console.log('[v0] Contest delayed');
      callbacks?.onContestDelayed?.(data.newStartTime);
    });

    // Admin broadcast
    socket.on('ADMIN_BROADCAST', (data: { type: string; text: string }) => {
      console.log('[v0] Admin broadcast:', data);
      callbacks?.onAdminBroadcast?.(data);
    });

    // Pong response (latency tracking)
    socket.on('PONG', (data: { timestamp: string }) => {
      const latency = Date.now() - new Date(data.timestamp).getTime();
      console.log(`[v0] WebSocket latency: ${latency}ms`);
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('[v0] WebSocket connection error:', error);
      setWsStatus('disconnected');
    });

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      socket.disconnect();
    };
  }, [contestId, participantId, callbacks]);

  return {
    socket: socketRef.current,
    wsStatus,
  };
}
