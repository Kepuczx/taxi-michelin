export interface Vehicle {
  id: number;
  registration: string;
  brand: string;
  model: string;
  passengerCapacity: number;
  status: 'dostępny' | 'w użyciu' | 'niedostępny';
  currentDriverId: number | null;
  currentDriver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  isBreakdown: boolean;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewVehicle {
  registration: string;
  brand: string;
  model: string;
  passengerCapacity: number;
  status?: 'dostępny' | 'w użyciu' | 'niedostępny';
  isBreakdown?: boolean;
  notes?: string;
}