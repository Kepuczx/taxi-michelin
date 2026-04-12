import api from './api';
import type { Vehicle, NewVehicle } from '../types/vehicle.types';

export const vehicleService = {
  // Pobierz wszystkie pojazdy
  async getAll(): Promise<Vehicle[]> {
    const response = await api.get('/vehicles');
    return response.data;
  },

  // Pobierz jeden pojazd
  async getById(id: number): Promise<Vehicle> {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Dodaj nowy pojazd (z opcjonalnym changedBy)
  async create(vehicleData: NewVehicle, changedBy?: string): Promise<Vehicle> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (changedBy) headers['X-Changed-By'] = changedBy;
    const response = await api.post('/vehicles', vehicleData, { headers });
    return response.data;
  },

  // Aktualizuj pojazd (z opcjonalnym changedBy)
  async update(id: number, vehicleData: Partial<NewVehicle>, changedBy?: string): Promise<Vehicle> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (changedBy) headers['X-Changed-By'] = changedBy;
    const response = await api.patch(`/vehicles/${id}`, vehicleData, { headers });
    return response.data;
  },

  // Usuń pojazd (z opcjonalnym changedBy)
  async delete(id: number, changedBy?: string): Promise<void> {
    const headers: any = {};
    if (changedBy) headers['X-Changed-By'] = changedBy;
    await api.delete(`/vehicles/${id}`, { headers });
  },

  // Przypisz kierowcę do pojazdu (z opcjonalnym changedBy)
  async assignDriver(vehicleId: number, driverId: number, changedBy?: string): Promise<Vehicle> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (changedBy) headers['X-Changed-By'] = changedBy;
    const response = await api.patch(`/vehicles/${vehicleId}/assign-driver/${driverId}`, {}, { headers });
    return response.data;
  },

  // Zwolnij kierowcę (z opcjonalnym changedBy)
  async releaseDriver(vehicleId: number, changedBy?: string): Promise<Vehicle> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (changedBy) headers['X-Changed-By'] = changedBy;
    const response = await api.patch(`/vehicles/${vehicleId}/release-driver`, {}, { headers });
    return response.data;
  },

  // Zgłoś awarię (z opcjonalnym changedBy)
  async reportBreakdown(vehicleId: number, description: string, changedBy?: string, photoUrl?: string): Promise<Vehicle> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (changedBy) headers['X-Changed-By'] = changedBy;
    const response = await api.post(`/vehicles/${vehicleId}/report-breakdown`, {
      description,
      photoUrl
    }, { headers });
    return response.data;
  }
};