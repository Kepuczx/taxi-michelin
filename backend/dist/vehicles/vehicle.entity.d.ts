import { VehicleLog } from './vehicle-log.entity';
import { User } from '../users/user.entity';
export type VehicleStatus = 'dostępny' | 'w użyciu' | 'niedostępny';
export declare class Vehicle {
    id: number;
    registration: string;
    brand: string;
    model: string;
    passengerCapacity: number;
    status: VehicleStatus;
    currentDriverId: number | null;
    currentDriver: User;
    isBreakdown: boolean;
    notes: string;
    logs: VehicleLog[];
    createdAt: Date;
    updatedAt: Date;
}
