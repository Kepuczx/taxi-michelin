import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleLog } from './vehicle-log.entity';
export declare class VehiclesService {
    private vehicleRepository;
    private vehicleLogRepository;
    constructor(vehicleRepository: Repository<Vehicle>, vehicleLogRepository: Repository<VehicleLog>);
    findAll(): Promise<Vehicle[]>;
    findOne(id: number): Promise<Vehicle>;
    getLogsByVehicle(vehicleId: number): Promise<VehicleLog[]>;
    getAllLogs(): Promise<VehicleLog[]>;
    create(vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle>;
    update(id: number, vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle>;
    remove(id: number): Promise<void>;
    toggleBreakdown(id: number, isBreakdown: boolean, changedBy?: string): Promise<Vehicle>;
    reportBreakdown(vehicleId: number, description: string, changedBy?: string, photoUrl?: string): Promise<Vehicle>;
    assignDriver(vehicleId: number, driverId: number, changedBy?: string): Promise<Vehicle>;
    releaseDriver(vehicleId: number, changedBy?: string): Promise<Vehicle>;
}
