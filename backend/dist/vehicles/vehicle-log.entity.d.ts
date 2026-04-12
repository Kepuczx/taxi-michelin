import { Vehicle } from './vehicle.entity';
import { User } from '../users/user.entity';
export type LogEventType = 'rozpoczęcie_pracy' | 'zakończenie_pracy' | 'przejazd' | 'uwagi' | 'awaria';
export declare class VehicleLog {
    id: number;
    vehicle: Vehicle;
    vehicleId: number;
    driver: User;
    driverId: number | null;
    eventType: LogEventType;
    eventTime: Date;
    passengersCount: number;
    description: string;
    photoUrl: string;
    startLocation: string;
    endLocation: string;
    distanceKm: number;
    changedBy: string;
    createdAt: Date;
}
