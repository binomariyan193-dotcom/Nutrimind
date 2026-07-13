import axios from 'axios';
import { supabase } from '../supabase';

const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = _rawApiUrl.replace(/\/+$/, '');

const getAuthHeaders = async (isMultipart = false) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export const uploadMealImage = async (file) => {
  try {
    const headers = await getAuthHeaders(true);
    const formData = new FormData();
    formData.append('file', file);

    // Hit the pipeline endpoint to trigger full analysis
    const response = await axios.post(`${API_URL}/pipeline/process_meal`, formData, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMealHistory = async (filters = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await axios.get(`${API_URL}/meals/history?${params.toString()}`, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
