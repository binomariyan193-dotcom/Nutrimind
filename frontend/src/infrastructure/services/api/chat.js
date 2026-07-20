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

export const chatApi = {
  askQuestion: async (message) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/chat/ask`, { message }, { headers });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
