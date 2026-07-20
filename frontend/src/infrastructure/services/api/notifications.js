import axios from 'axios';
import { supabase } from '../supabase';

const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = _rawApiUrl.replace(/\/+$/, '');

const getAuthHeaders = async () => {
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
