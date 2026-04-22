import { Repository } from 'typeorm';
import { Trip } from './trips.entity';
import { TripsGateway } from './trips.gateway';
import { DriverLog } from '../users/driver-log.entity';
import { User } from '../users/user.entity';
export declare class TripsService {
    private tripRepository;
    private driverLogRepository;
    private userRepository;
    private readonly tripsGateway;
    constructor(tripRepository: Repository<Trip>, driverLogRepository: Repository<DriverLog>, userRepository: Repository<User>, tripsGateway: TripsGateway);
    requestTrip(clientId: number, data: any): Promise<Trip>;
    acceptTrip(tripId: number, driverId: number): Promise<Trip>;
    getPendingTrips(): Promise<Trip[]>;
    startTrip(tripId: number, driverId: number, ipAddress?: string, userAgent?: string): Promise<Trip>;
    completeTrip(tripId: number, driverId: number, ipAddress?: string, userAgent?: string): Promise<Trip>;
    getDriverAssignedTrips(driverId: number): Promise<Trip[]>;
    getClientHistory(clientId: number): Promise<Trip[]>;
    getTripDetails(tripId: number): Promise<Trip>;
    getClientActiveTrip(clientId: number): Promise<Trip | null>;
    cancelTrip(tripId: number, userId: number, reason?: string): Promise<Trip>;
    getDriverActiveTrip(driverId: number): Promise<Trip | null>;
    getAllTrips(): Promise<Trip[]>;
}
