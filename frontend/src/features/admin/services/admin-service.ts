import axios from 'axios';
import { environment } from '@/config/environment';

const API_URL = `${environment.apiUrl}/api/admin`;

export const adminService = {
  getAllUsers: async () => {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  },

  getUserById: async (id: number) => {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  },

  getAllHorses: async () => {
    const response = await axios.get(`${API_URL}/horses`);
    return response.data;
  },

  getHorseById: async (id: number) => {
    const response = await axios.get(`${API_URL}/horses/${id}`);
    return response.data;
  },
};