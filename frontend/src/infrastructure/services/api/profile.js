import axios from 'axios';
import { supabase } from '../supabase';

const API_URL = 'http://localhost:8000';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const getHealthProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/profile/health`, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateHealthProfile = async (profileData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/profile/health`, profileData, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
