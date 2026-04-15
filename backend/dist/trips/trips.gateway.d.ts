import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Trip } from './trips.entity';
import { TripsService } from './trips.service';
export declare class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly tripsService;
    server: Server;
    constructor(tripsService: TripsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastNewTrip(trip: Trip): void;
    broadcastTripAccepted(tripId: number): void;
    broadcastTripCancelled(tripId: number): void;
    handleGetPendingTrips(client: Socket): Promise<void>;
}
