import { TripsService } from './trips.service';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    requestTrip(data: any): Promise<import("./trips.entity").Trip>;
    getClientHistory(clientId: string): Promise<import("./trips.entity").Trip[]>;
    acceptTrip(id: string, driverId: number): Promise<import("./trips.entity").Trip>;
    getDriverAssignedTrips(driverId: string): Promise<import("./trips.entity").Trip[]>;
    getDriverActiveTrip(driverId: string): Promise<import("./trips.entity").Trip | null>;
    startTrip(id: string, driverId: number): Promise<import("./trips.entity").Trip>;
    completeTrip(id: string, driverId: number): Promise<import("./trips.entity").Trip>;
    getPendingTrips(): Promise<import("./trips.entity").Trip[]>;
    getClientActiveTrip(clientId: string): Promise<import("./trips.entity").Trip | null>;
    cancelTrip(id: string, reason: string, userId: number): Promise<import("./trips.entity").Trip>;
    getAllTrips(): Promise<import("./trips.entity").Trip[]>;
}
