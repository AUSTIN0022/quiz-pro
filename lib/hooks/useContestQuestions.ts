'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/lib/services/quiz-service';
import { Question } from '@/lib/types';
import { toast } from 'sonner';

export function useContestQuestions(contestId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-contest-questions', contestId],
    queryFn: async () => {
      const response = await quizService.getQuestionsByContestId(contestId);
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: (question: Omit<Question, 'id'>) => quizService.addQuestion(contestId, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
      toast.success('Question added successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Question> }) => 
      quizService.updateQuestion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
      toast.success('Question updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizService.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
      toast.success('Question deleted');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => quizService.reorderQuestions(contestId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Question> }) => 
      quizService.bulkUpdateQuestions(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
      toast.success('Bulk update successful');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (question: Question) => {
      const { id, ...rest } = question;
      return quizService.addQuestion(contestId, {
        ...rest,
        text: `${rest.text} (Copy)`,
        questionNumber: (query.data?.length || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contest-questions', contestId] });
      toast.success('Question duplicated');
    },
  });

  return {
    ...query,
    addQuestion: addMutation.mutateAsync,
    updateQuestion: updateMutation.mutateAsync,
    deleteQuestion: deleteMutation.mutateAsync,
    reorderQuestions: reorderMutation.mutateAsync,
    bulkUpdateQuestions: bulkUpdateMutation.mutateAsync,
    duplicateQuestion: duplicateMutation.mutateAsync,
    isMutating: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reorderMutation.isPending || bulkUpdateMutation.isPending
  };
}
