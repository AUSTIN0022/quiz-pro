import { useState, useEffect, useCallback } from 'react';
import { submissionService } from '@/lib/services/submission-service';
import type { QuizAttempt, ApiResponse } from '@/lib/types';

export function useSubmissions(contestId: string) {
    const [submissions, setSubmissions] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await submissionService.getSubmissions(contestId);
            if (response.success && response.data) {
                setSubmissions(response.data);
            } else {
                setError(response.error || 'Failed to fetch submissions');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [contestId]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    return { submissions, loading, error, refetch: fetchSubmissions };
}
