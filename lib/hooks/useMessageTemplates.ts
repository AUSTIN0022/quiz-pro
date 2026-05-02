import { useState, useEffect } from 'react';
import { MessageTemplate } from '@/lib/types';
import { messageService } from '@/lib/services/message-service';

export function useMessageTemplates(orgId: string) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const data = await messageService.getTemplates(orgId);
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [orgId]);

  const createTemplate = async (data: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const template = await messageService.createTemplate(data);
      setTemplates(prev => [...prev, template]);
      return template;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      setError(message);
      throw err;
    }
  };

  const updateTemplate = async (id: string, data: Partial<MessageTemplate>) => {
    try {
      const template = await messageService.updateTemplate(id, data);
      if (template) {
        setTemplates(prev => prev.map(t => t.id === id ? template : t));
      }
      return template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const success = await messageService.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      throw err;
    }
  };

  const systemTemplates = templates.filter(t => t.isSystem);
  const customTemplates = templates.filter(t => !t.isSystem);

  return {
    templates,
    systemTemplates,
    customTemplates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
