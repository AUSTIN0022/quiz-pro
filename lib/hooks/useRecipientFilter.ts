import { useState, useEffect } from 'react';
import { RecipientFilter } from '@/lib/types';
import { messageService } from '@/lib/services/message-service';

export function useRecipientFilter(contestId: string) {
  const [filter, setFilter] = useState<RecipientFilter>('all');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCount = async () => {
      setLoading(true);
      try {
        const recipientCount = await messageService.calculateRecipientCount(contestId, filter);
        setCount(recipientCount);
      } catch (err) {
        console.error('[v0] Failed to calculate recipient count:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCount();
  }, [contestId, filter]);

  return {
    filter,
    setFilter,
    count,
    loading,
  };
}
