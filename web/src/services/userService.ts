import api from './api';
import type { User, NewUser } from '../types/user.types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (userData: NewUser): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Ta funkcja wysyła dane do Twojego NestJS
  update: async (id: number, data: { email?: string; password?: string }): Promise<unknown> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  }
};