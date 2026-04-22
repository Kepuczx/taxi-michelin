import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleLog } from './vehicle-log.entity';
import { DriverLog } from '../users/driver-log.entity';
import { User } from '../users/user.entity';
export declare class VehiclesService {
    private vehicleRepository;
    private vehicleLogRepository;
    private driverLogRepository;
    private userRepository;
    constructor(vehicleRepository: Repository<Vehicle>, vehicleLogRepository: Repository<VehicleLog>, driverLogRepository: Repository<DriverLog>, userRepository: Repository<User>);
    findAll(): Promise<Vehicle[]>;
    findOne(id: number): Promise<Vehicle>;
    getLogsByVehicle(vehicleId: number): Promise<VehicleLog[]>;
    getAllLogs(): Promise<VehicleLog[]>;
    create(vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle>;
    update(id: number, vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle>;
    remove(id: number): Promise<void>;
    toggleBreakdown(id: number, isBreakdown: boolean, changedBy?: string): Promise<Vehicle>;
    reportBreakdown(vehicleId: number, description: string, changedBy?: string, photoUrl?: string): Promise<Vehicle>;
    assignDriver(vehicleId: number, driverId: number, changedBy?: string, ipAddress?: string, userAgent?: string): Promise<Vehicle>;
    releaseDriver(vehicleId: number, changedBy?: string, ipAddress?: string, userAgent?: string): Promise<Vehicle>;
}
