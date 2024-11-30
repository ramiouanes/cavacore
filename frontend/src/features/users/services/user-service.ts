import axios from 'axios';
import { User } from '../types/user.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await axios.get<User>(`${API_URL}/api/users/by-email/${email}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      return new Error(error.response?.data?.message || error.message);
    }
    return new Error('An unexpected error occurred');
  }

  async findById(id: string): Promise<User | null> {
    try {
      // console.log('Making API call for userId at user service:', id);
      const response = await axios.get<User>(`${API_URL}/api/users/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }
}

export const userService = UserService.getInstance();