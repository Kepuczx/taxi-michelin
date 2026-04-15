import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Trip } from './trips.entity';
import { TripsService } from './trips.service';
export declare class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly tripsService;
    server: Server;
    private tripRooms;
    constructor(tripsService: TripsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTripRoom(client: Socket, tripId: number): void;
    handleLeaveTripRoom(client: Socket, tripId: number): void;
    handleDriverLocation(client: Socket, data: {
        tripId: number;
        location: {
            lat: number;
            lng: number;
        };
    }): void;
    broadcastNewTrip(trip: Trip): void;
    broadcastTripAccepted(tripId: number): void;
    broadcastTripCancelled(tripId: number): void;
    broadcastTripStatusChanged(tripId: number, status: string): void;
}
