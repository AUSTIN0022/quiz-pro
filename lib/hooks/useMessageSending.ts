import { useState } from 'react';
import { SentMessage, MessageDraft, RecipientFilter, MessageChannel } from '@/lib/types';
import { messageService } from '@/lib/services/message-service';

interface SendOptions {
  contestId: string;
  templateId: string;
  recipientFilter: RecipientFilter;
  channel: MessageChannel;
}

interface ScheduleOptions extends SendOptions {
  scheduledFor: string;
}

export function useMessageSending() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNow = async (options: SendOptions): Promise<SentMessage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await messageService.sendMessage(
        options.contestId,
        options.templateId,
        options.recipientFilter,
        options.channel
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scheduleMessage = async (options: ScheduleOptions): Promise<MessageDraft | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await messageService.scheduleMessage(
        options.contestId,
        options.templateId,
        options.recipientFilter,
        options.channel,
        options.scheduledFor
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule message';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendNow,
    scheduleMessage,
  };
}
