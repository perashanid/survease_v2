import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AdminSurvey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  tags: string[];
  is_public: boolean;
  is_active: boolean;
  is_featured: boolean;
  allow_import: boolean;
  import_count: number;
  created_at: string;
  updated_at: string;
  response_count: number;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  survey_count: number;
  response_count: number;
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalSurveys: number;
    publicSurveys: number;
    featuredSurveys: number;
    totalResponses: number;
  };
  recentActivity: {
    newUsers: number;
    newSurveys: number;
    newResponses: number;
  };
  topSurveys: Array<{
    _id: string;
    title: string;
    response_count: number;
    is_featured: boolean;
    is_public: boolean;
    created_at: string;
  }>;
}

export const adminService = {
  // Get all surveys with admin details
  async getSurveys(page = 1, limit = 20, search = '', filter = 'all') {
    const response = await axios.get(`${API_URL}/admin/surveys`, {
      headers: getAuthHeader(),
      params: { page, limit, search, filter }
    });
    return response.data;
  },

  // Toggle featured status
  async toggleFeatured(surveyId: string, isFeatured: boolean) {
    const response = await axios.patch(
      `${API_URL}/admin/surveys/${surveyId}/feature`,
      { is_featured: isFeatured },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Update survey visibility
  async updateVisibility(surveyId: string, isPublic?: boolean, isActive?: boolean) {
    const data: any = {};
    if (isPublic !== undefined) data.is_public = isPublic;
    if (isActive !== undefined) data.is_active = isActive;

    const response = await axios.patch(
      `${API_URL}/admin/surveys/${surveyId}/visibility`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Delete survey
  async deleteSurvey(surveyId: string) {
    const response = await axios.delete(
      `${API_URL}/admin/surveys/${surveyId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get admin statistics
  async getStats() {
    const response = await axios.get(`${API_URL}/admin/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get all users
  async getUsers(page = 1, limit = 20, search = '') {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: getAuthHeader(),
      params: { page, limit, search }
    });
    return response.data;
  }
};
