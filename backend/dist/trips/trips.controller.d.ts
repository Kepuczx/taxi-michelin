import { TripsService } from './trips.service';
import type { Request } from 'express';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    requestTrip(data: any): Promise<import("./trips.entity").Trip>;
    getClientHistory(clientId: string): Promise<import("./trips.entity").Trip[]>;
    acceptTrip(id: string, driverId: number, driverLat?: number, driverLng?: number, driverAddress?: string): Promise<import("./trips.entity").Trip>;
    getDriverAssignedTrips(driverId: string): Promise<import("./trips.entity").Trip[]>;
    getDriverActiveTrip(driverId: string): Promise<import("./trips.entity").Trip | null>;
    startTrip(id: string, driverId: number, req: Request): Promise<import("./trips.entity").Trip>;
    completeTrip(id: string, driverId: number, req: Request): Promise<import("./trips.entity").Trip>;
    getPendingTrips(): Promise<import("./trips.entity").Trip[]>;
    getClientActiveTrip(clientId: string): Promise<import("./trips.entity").Trip | null>;
    cancelTrip(id: string, reason: string, userId: number): Promise<import("./trips.entity").Trip>;
    getAllTrips(): Promise<import("./trips.entity").Trip[]>;
    getDriverHistory(driverId: string): Promise<import("./trips.entity").Trip[]>;
    getDriverStats(driverId: string): Promise<any>;
}
