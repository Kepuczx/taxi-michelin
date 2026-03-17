import api from './api';
import type { User, NewUser } from '../types/user.types';

export const userService = {
  // Pobierz wszystkich użytkowników
  async getAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  // Pobierz jednego użytkownika
  async getById(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Dodaj nowego użytkownika
  async create(userData: NewUser): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Aktualizuj użytkownika
  async update(id: number, userData: Partial<NewUser>): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Usuń użytkownika
  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};