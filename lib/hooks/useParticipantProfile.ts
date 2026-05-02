import { useState, useCallback, useEffect } from 'react';
import { ParticipantProfile, ApiResponse } from '@/lib/types';
import { participantService } from '@/lib/services/participant-service';

export function useParticipantProfile(participantId: string) {
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await participantService.getProfile(participantId);
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError(response.message || 'Failed to load profile');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchProfile();
    }
  }, [participantId]);

  const updateProfile = useCallback(
    async (updates: Partial<ParticipantProfile>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await participantService.updateProfile(participantId, updates);
        if (response.success && response.data) {
          setProfile(response.data);
          return response.data;
        } else {
          setError(response.message || 'Failed to update profile');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [participantId]
  );

  const updateNotifications = useCallback(
    async (prefs: ParticipantProfile['notificationPreferences']) => {
      setError(null);
      try {
        const response = await participantService.updateNotificationPreferences(participantId, prefs);
        if (response.success && response.data) {
          setProfile(response.data);
          return response.data;
        } else {
          setError(response.message || 'Failed to update preferences');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      }
    },
    [participantId]
  );

  const uploadAvatar = useCallback(
    async (imageUrl: string) => {
      setError(null);
      try {
        const response = await participantService.uploadAvatar(participantId, imageUrl);
        if (response.success && response.data) {
          setProfile(response.data);
          return response.data;
        } else {
          setError(response.message || 'Failed to upload avatar');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      }
    },
    [participantId]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateNotifications,
    uploadAvatar,
  };
}
