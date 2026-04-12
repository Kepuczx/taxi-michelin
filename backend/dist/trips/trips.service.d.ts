import { Repository } from 'typeorm';
import { Trip } from './trips.entity';
export declare class TripsService {
    private tripRepository;
    constructor(tripRepository: Repository<Trip>);
    requestTrip(clientId: number, data: any): Promise<Trip>;
    acceptTrip(tripId: number, driverId: number): Promise<Trip>;
    startTrip(tripId: number, driverId: number): Promise<Trip>;
    completeTrip(tripId: number, driverId: number): Promise<Trip>;
    getDriverActiveTrips(driverId: number): Promise<Trip[]>;
    getClientHistory(clientId: number): Promise<Trip[]>;
    getTripDetails(tripId: number): Promise<Trip>;
}
