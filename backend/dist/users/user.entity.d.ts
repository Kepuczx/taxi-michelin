import { Vehicle } from '../vehicles/vehicle.entity';
import { DriverLog } from './driver-log.entity';
export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    currentLat: number;
    currentLng: number;
    isOnline: boolean;
    isActive: boolean;
    ldapDn: string;
    currentVehicle: Vehicle;
    driverLogs: DriverLog[];
    createdAt: Date;
    updatedAt: Date;
}
