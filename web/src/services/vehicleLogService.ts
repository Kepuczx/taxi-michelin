import api from './api';
import type { VehicleLog } from '../types/vehicleLog.types';

export const vehicleLogService = {
  // Pobierz logi dla konkretnego pojazdu
  async getByVehicleId(vehicleId: number): Promise<VehicleLog[]> {
    // 🔥 DODAJ /vehicles/ przed ścieżką
    const response = await api.get(`/vehicles/vehicle-logs/vehicle/${vehicleId}`);
    return response.data;
  },

  // Pobierz wszystkie logi (dla admina)
  async getAll(): Promise<VehicleLog[]> {
    const response = await api.get('/vehicles/vehicle-logs');
    return response.data;
  },
};