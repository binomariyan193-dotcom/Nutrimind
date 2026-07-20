import axios from 'axios';
import { supabase } from '../supabase';

const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = _rawApiUrl.replace(/\/+$/, '');

const getAuthHeaders = async () => {
  return {
    'Authorization': `Bearer demo-token`,
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
