import axios from 'axios';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const notificationsApi = {
  getNotifications: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/notifications`, { headers });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/notifications/${notificationId}/read`, {}, { headers });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
