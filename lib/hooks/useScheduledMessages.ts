import { useState, useEffect } from 'react';
import { MessageDraft } from '@/lib/types';
import { messageService } from '@/lib/services/message-service';

export function useScheduledMessages(contestId: string) {
  const [messages, setMessages] = useState<MessageDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await messageService.getScheduledMessages(contestId);
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scheduled messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [contestId]);

  const cancelScheduled = async (id: string) => {
    try {
      const success = await messageService.cancelScheduled(id);
      if (success) {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel scheduled message';
      setError(message);
      return false;
    }
  };

  return {
    messages,
    loading,
    error,
    cancelScheduled,
  };
}
