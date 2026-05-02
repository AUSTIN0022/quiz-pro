import { useState, useEffect } from 'react';
import { SentMessage } from '@/lib/types';
import { messageService } from '@/lib/services/message-service';

export function useSentMessages(contestId: string) {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await messageService.getSentMessages(contestId);
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sent messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [contestId]);

  const getDeliveryRate = (message: SentMessage): number => {
    if (message.totalRecipients === 0) return 0;
    return (message.deliveredCount / message.totalRecipients) * 100;
  };

  const getDeliveryStatus = async (messageId: string) => {
    try {
      return await messageService.getDeliveryStatus(messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery status');
      return null;
    }
  };

  return {
    messages,
    loading,
    error,
    getDeliveryRate,
    getDeliveryStatus,
  };
}
