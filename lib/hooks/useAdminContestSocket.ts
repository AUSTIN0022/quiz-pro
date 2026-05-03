import { useEffect, useCallback, useState, useRef } from 'react';
import io, { type Socket } from 'socket.io-client';

const USE_SEED_WS = process.env.NEXT_PUBLIC_USE_SEED_WS === 'true';

export interface LiveParticipant {
  participantId: string;
  name: string;
  avatarInitials: string;
  currentQuestion: number;
  answeredCount: number;
  totalQuestions: number;
  estimatedCorrect: number;
  estimatedScorePercent: number;
  timeRemainingSeconds: number;
  status: 'active' | 'submitted' | 'disconnected' | 'flagged';
  proctoringAlerts: number;
  lastActivityAt: string;
  isInWaitingRoom: boolean;
  timeOnQuestion: number; // For "On Q{n} for {Xm Ys}"
}

export interface BroadcastMessage {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  message: string;
  target: 'all' | 'active' | 'waiting';
  sentAt: string;
  sentBy: string;
}

export interface ProctorAlert {
  participantId: string;
  name: string;
  type: 'tab-switch' | 'camera-off' | 'no-face' | 'multiple-faces' | 'fullscreen-exit' | 'copy-paste';
  warningCount: number;
  maxWarnings: number;
  questionContext: string;
  timestamp: string;
  autoSubmitted?: boolean;
}

export function useAdminContestSocket(
  contestId: string,
  adminId: string,
  onParticipantUpdate?: (participant: LiveParticipant) => void,
  onBroadcastMessage?: (message: BroadcastMessage) => void,
  onProctorAlert?: (alert: ProctorAlert) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_SEED_WS) {
      // SEED MODE: Generate simulated participants from MockDB
      let updateInterval: ReturnType<typeof setInterval>;
      
      import('@/lib/mock/relations').then(({ getLiveParticipantsForContest }) => {
        const initial = getLiveParticipantsForContest(contestId);
        setParticipants(initial);
        setConnected(true);
        setError(null);

        // Simulate real-time updates every 2 seconds
        updateInterval = setInterval(() => {
          setParticipants((prev) =>
            prev.map((p) => {
              if (p.status === 'submitted' || p.status === 'disconnected') return p;
              
              const shouldAnswer = Math.random() > 0.6 && p.answeredCount < p.totalQuestions;
              const shouldSubmit = p.answeredCount >= p.totalQuestions - 1 && Math.random() > 0.8;

              return {
                ...p,
                answeredCount: shouldAnswer ? Math.min(p.answeredCount + 1, p.totalQuestions) : p.answeredCount,
                currentQuestion: shouldAnswer ? Math.min(p.currentQuestion + 1, p.totalQuestions) : p.currentQuestion,
                timeOnQuestion: shouldAnswer ? 0 : p.timeOnQuestion + 2,
                timeRemainingSeconds: Math.max(0, p.timeRemainingSeconds - 2),
                status: shouldSubmit ? 'submitted' : p.status,
                estimatedScorePercent: Math.min(100, p.estimatedScorePercent + (shouldAnswer ? Math.round(Math.random() * 4) : 0)),
              };
            })
          );
        }, 2000);
      });

      return () => {
        if (updateInterval) clearInterval(updateInterval);
      };
    }

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

    socket.on('PROCTOR_ALERT', (alert: ProctorAlert) => {
      if (onProctorAlert) {
        onProctorAlert(alert);
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
      totalJoined: participants.length,
      activeNow: participants.filter(p => p.status === 'active').length,
      submitted: participants.filter(p => p.status === 'submitted').length,
      flagged: participants.filter(p => p.status === 'flagged').length,
      inWaitingRoom: participants.filter(p => p.isInWaitingRoom).length,
      disconnected: participants.filter(p => p.status === 'disconnected').length
    };
  }, [participants]);

  const forceSubmitParticipant = useCallback((participantId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('FORCE_SUBMIT_PARTICIPANT', { participantId, adminId });
  }, [adminId]);

  return {
    connected,
    participants,
    messages,
    error,
    sendBroadcast,
    getParticipantStats,
    forceSubmitParticipant
  };
}
