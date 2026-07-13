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
