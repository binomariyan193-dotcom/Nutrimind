import axios from 'axios';
import { supabase } from '../supabase';

const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = _rawApiUrl.replace(/\/+$/, '');

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const adminApi = {
  getSystemStats: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/admin/stats`, { headers });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
