import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import type { Request } from 'express';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    findAll(): Promise<Vehicle[]>;
    findOne(id: number): Promise<Vehicle>;
    create(vehicleData: Partial<Vehicle>, req: Request): Promise<Vehicle>;
    update(id: number, vehicleData: Partial<Vehicle>, req: Request): Promise<Vehicle>;
    remove(id: number, req: Request): Promise<void>;
    getLogsByVehicle(vehicleId: number): Promise<import("./vehicle-log.entity").VehicleLog[]>;
    getAllLogs(): Promise<import("./vehicle-log.entity").VehicleLog[]>;
    toggleBreakdown(id: number, body: {
        isBreakdown: boolean;
    }, req: Request): Promise<Vehicle>;
    assignDriver(id: number, driverId: number, req: Request): Promise<Vehicle>;
    releaseDriver(id: number, req: Request): Promise<Vehicle>;
    reportBreakdown(id: number, body: {
        description: string;
        photoUrl?: string;
    }, req: Request): Promise<Vehicle>;
}
