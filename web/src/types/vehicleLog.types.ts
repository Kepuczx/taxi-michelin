export interface VehicleLog {
  id: number;
  vehicleId: number;
  driverId: number | null;
  eventType: 'rozpoczęcie_pracy' | 'zakończenie_pracy' | 'przejazd' | 'uwagi' | 'awaria';
  eventTime: string;
  passengersCount: number | null;
  description: string | null;
  photoUrl: string | null;
  startLocation: string | null;
  endLocation: string | null;
  distanceKm: number | null;
  createdAt: string;
  changedBy?: string; // 🔥 DODANE
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}