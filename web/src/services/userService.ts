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

 
async update(id: number | string, userData: any) {
    // 1. Używamy .patch(), bo tak ustawiliśmy w kontrolerze NestJS (@Patch)
    // 2. id może być stringiem (UUID), co teraz backend już akceptuje
    const response = await api.patch(`/users/${id}`, userData);
    
    // Zwracamy dane, które przyszły z backendu (zaktualizowany obiekt użytkownika)
    return response.data;
  },


  // Usuń użytkownika
  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }



};