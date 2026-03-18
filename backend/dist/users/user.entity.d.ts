import { Vehicle } from '../vehicles/vehicle.entity';
export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isActive: boolean;
    ldapDn: string;
    currentVehicle: Vehicle;
    createdAt: Date;
    updatedAt: Date;
}
