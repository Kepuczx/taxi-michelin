import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleLog } from './vehicle-log.entity';
export declare class VehiclesService {
    private vehicleRepository;
    private vehicleLogRepository;
    constructor(vehicleRepository: Repository<Vehicle>, vehicleLogRepository: Repository<VehicleLog>);
    findAll(): Promise<Vehicle[]>;
    findOne(id: number): Promise<Vehicle>;
    create(vehicleData: Partial<Vehicle>): Promise<Vehicle>;
    update(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle>;
    remove(id: number): Promise<void>;
    assignDriver(vehicleId: number, driverId: number): Promise<Vehicle>;
    releaseDriver(vehicleId: number): Promise<Vehicle>;
    reportBreakdown(vehicleId: number, description: string, photoUrl?: string): Promise<Vehicle>;
}
