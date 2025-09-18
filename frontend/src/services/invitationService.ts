import { apiClient as api } from './api';

export interface InvitationToken {
  id: string;
  token: string;
  survey_id: string;
  description?: string;
  expires_at?: string;
  max_uses?: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  invitation_url: string;
  is_expired?: boolean;
  is_usage_exceeded?: boolean;
}

export interface CreateInvitationData {
  description?: string;
  expires_at?: string;
  max_uses?: number;
}

export interface UpdateInvitationData {
  description?: string;
  expires_at?: string | null;
  max_uses?: number | null;
  is_active?: boolean;
}

export class InvitationService {
  /**
   * Create a new invitation token for a survey
   */
  static async createInvitation(surveyId: string, data: CreateInvitationData): Promise<InvitationToken> {
    const response = await api.post(`/surveys/${surveyId}/invitations`, data);
    return response.data.data.invitation;
  }

  /**
   * Get all invitation tokens for a survey
   */
  static async getInvitations(surveyId: string): Promise<InvitationToken[]> {
    const response = await api.get(`/surveys/${surveyId}/invitations`);
    return response.data.data.invitations;
  }

  /**
   * Update an invitation token
   */
  static async updateInvitation(
    surveyId: string, 
    tokenId: string, 
    data: UpdateInvitationData
  ): Promise<InvitationToken> {
    const response = await api.put(`/surveys/${surveyId}/invitations/${tokenId}`, data);
    return response.data.data.invitation;
  }

  /**
   * Revoke an invitation token
   */
  static async revokeInvitation(surveyId: string, tokenId: string): Promise<void> {
    await api.delete(`/surveys/${surveyId}/invitations/${tokenId}`);
  }

  /**
   * Copy invitation URL to clipboard
   */
  static async copyInvitationUrl(url: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy invitation URL:', error);
      return false;
    }
  }

  /**
   * Format invitation expiry date for display
   */
  static formatExpiryDate(expiryDate?: string): string {
    if (!expiryDate) return 'Never expires';
    
    const date = new Date(expiryDate);
    const now = new Date();
    
    if (date < now) return 'Expired';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get invitation status
   */
  static getInvitationStatus(invitation: InvitationToken): {
    status: 'active' | 'expired' | 'usage_exceeded' | 'inactive';
    label: string;
    color: string;
  } {
    if (!invitation.is_active) {
      return { status: 'inactive', label: 'Revoked', color: 'red' };
    }
    
    if (invitation.is_expired) {
      return { status: 'expired', label: 'Expired', color: 'orange' };
    }
    
    if (invitation.is_usage_exceeded) {
      return { status: 'usage_exceeded', label: 'Usage Limit Reached', color: 'orange' };
    }
    
    return { status: 'active', label: 'Active', color: 'green' };
  }
}