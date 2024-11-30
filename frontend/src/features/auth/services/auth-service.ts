// frontend/src/features/auth/services/auth-service.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// console.log('API URL:', API_URL);

export type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

export type RegisterDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

// Configure axios interceptors
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await authService.refreshToken(refreshToken);
          localStorage.setItem('token', response.accessToken);
          error.config.headers.Authorization = `Bearer ${response.accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
      try {
        const response = await axios.post(`${API_URL}/api/auth/register`, data);
        this.setTokens(response.data.accessToken, response.data.refreshToken);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 409) {
            throw new Error('Email already registered. Please use a different email.');
          }
        }
        throw new Error('An error occurred during registration. Please try again.');
      }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'An error occurred during login');
      }
      throw new Error('An error occurred during login');
    }
  },

  async refreshToken(refreshToken: string) {
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await axios.get(`${API_URL}/api/auth/me`);
    return response.data;
  },

  async changePassword(data: ChangePasswordDto) {
    const response = await axios.post(`${API_URL}/auth/change-password`, data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
    return response.data;
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },  

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },
};