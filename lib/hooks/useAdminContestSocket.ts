import { useEffect, useCallback, useState, useRef } from 'react';
import io, { type Socket } from 'socket.io-client';

export interface LiveParticipant {
  participantId: string;
  participantName: string;
  currentQuestion: number;
  totalQuestions: number;
  timeOnQuestion: number;
  status: 'active' | 'submitted' | 'flagged' | 'disconnected';
  proctoringAlerts: number;
  lastUpdated: string;
}

export interface BroadcastMessage {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  message: string;
  target: 'all' | 'active' | 'waiting';
  sentAt: string;
  sentBy: string;
}

export function useAdminContestSocket(
  contestId: string,
  adminId: string,
  onParticipantUpdate?: (participant: LiveParticipant) => void,
  onBroadcastMessage?: (message: BroadcastMessage) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        contestId,
        adminId,
        role: 'admin'
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[v0] Admin socket connected');
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[v0] Admin socket disconnected');
      setConnected(false);
    });

    socket.on('error', (err) => {
      console.error('[v0] Socket error:', err);
      setError(err.message || 'Socket connection error');
    });

    socket.on('BULK_UPDATE', (data: LiveParticipant[]) => {
      setParticipants(data);
    });

    socket.on('PARTICIPANT_UPDATE', (participant: LiveParticipant) => {
      setParticipants(prev => {
        const index = prev.findIndex(p => p.participantId === participant.participantId);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = participant;
          return updated;
        }
        return [...prev, participant];
      });

      if (onParticipantUpdate) {
        onParticipantUpdate(participant);
      }
    });

    socket.on('BROADCAST_MESSAGE', (message: BroadcastMessage) => {
      setMessages(prev => [...prev, message]);

      if (onBroadcastMessage) {
        onBroadcastMessage(message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [contestId, adminId, onParticipantUpdate, onBroadcastMessage]);

  const sendBroadcast = useCallback(
    (message: string, type: 'info' | 'warning' | 'urgent', target: 'all' | 'active' | 'waiting') => {
      if (!socketRef.current?.connected) {
        setError('Socket not connected');
        return;
      }

      socketRef.current.emit('SEND_BROADCAST', {
        message,
        type,
        target,
        sentBy: adminId
      });
    },
    [adminId]
  );

  const getParticipantStats = useCallback(() => {
    return {
      total: participants.length,
      active: participants.filter(p => p.status === 'active').length,
      submitted: participants.filter(p => p.status === 'submitted').length,
      flagged: participants.filter(p => p.status === 'flagged').length,
      disconnected: participants.filter(p => p.status === 'disconnected').length
    };
  }, [participants]);

  return {
    connected,
    participants,
    messages,
    error,
    sendBroadcast,
    getParticipantStats
  };
}
