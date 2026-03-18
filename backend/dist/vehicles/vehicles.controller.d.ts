import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    findAll(): Promise<Vehicle[]>;
    findOne(id: number): Promise<Vehicle>;
    create(vehicleData: Partial<Vehicle>): Promise<Vehicle>;
    update(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle>;
    remove(id: number): Promise<void>;
    assignDriver(id: number, driverId: number): Promise<Vehicle>;
    releaseDriver(id: number): Promise<Vehicle>;
    reportBreakdown(id: number, body: {
        description: string;
        photoUrl?: string;
    }): Promise<Vehicle>;
}
