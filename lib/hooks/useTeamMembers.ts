import { useState, useCallback, useEffect } from 'react';
import { TeamMember, TeamInvitation, TeamRole, ApiResponse } from '@/lib/types';
import { organizationService } from '@/lib/services/organization-service';

export function useTeamMembers(orgId: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [membersRes, invitationsRes] = await Promise.all([
          organizationService.getTeamMembers(orgId),
          organizationService.getTeamInvitations(orgId),
        ]);

        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data);
        }
        if (invitationsRes.success && invitationsRes.data) {
          setInvitations(invitationsRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchData();
    }
  }, [orgId]);

  const inviteMember = useCallback(
    async (email: string, role: TeamRole) => {
      setError(null);
      try {
        const response = await organizationService.inviteTeamMember(orgId, email, role);
        if (response.success && response.data) {
          setInvitations([...invitations, response.data]);
          return response.data;
        } else {
          setError(response.message || 'Failed to send invitation');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      }
    },
    [orgId, invitations]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      setError(null);
      try {
        const response = await organizationService.removeTeamMember(orgId, memberId);
        if (response.success) {
          setMembers(members.filter(m => m.id !== memberId));
          return true;
        } else {
          setError(response.message || 'Failed to remove member');
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return false;
      }
    },
    [orgId, members]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: TeamRole) => {
      setError(null);
      try {
        const response = await organizationService.updateTeamMemberRole(orgId, memberId, role);
        if (response.success && response.data) {
          setMembers(members.map(m => (m.id === memberId ? response.data! : m)).filter(Boolean));
          return response.data;
        } else {
          setError(response.message || 'Failed to update role');
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return null;
      }
    },
    [orgId, members]
  );

  const revokeInvitation = useCallback(
    async (invitationId: string) => {
      setError(null);
      try {
        const response = await organizationService.revokeInvitation(orgId, invitationId);
        if (response.success) {
          setInvitations(invitations.filter(i => i.id !== invitationId));
          return true;
        } else {
          setError(response.message || 'Failed to revoke invitation');
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        return false;
      }
    },
    [orgId, invitations]
  );

  return {
    members,
    invitations,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    revokeInvitation,
  };
}
