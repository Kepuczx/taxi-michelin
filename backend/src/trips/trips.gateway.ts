import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Trip } from './trips.entity';
import { TripsService } from './trips.service';

@WebSocketGateway({ cors: '*' })
@Injectable()
export class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Podłączono klienta: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Odłączono klienta: ${client.id}`);
  }

  broadcastNewTrip(trip: Trip) {
    this.server.emit('newTrip', trip);
    console.log(`[WebSocket] Wysłano powiadomienie o nowym kursie #${trip.id}`);
  }

  broadcastTripAccepted(tripId: number) {
    this.server.emit('tripAccepted', tripId);
    console.log(`[WebSocket] Kurs #${tripId} zniknął z giełdy (został przyjęty)`);
  }

  broadcastTripCancelled(tripId: number) {
    this.server.emit('tripCancelled', tripId);
    console.log(`[WebSocket] Kurs #${tripId} został anulowany`);
  }

  @SubscribeMessage('getPendingTrips')
  async handleGetPendingTrips(client: Socket) {
    try {
      const trips = await this.tripsService.getPendingTrips();
      client.emit('pendingTrips', trips);
      console.log(`[WebSocket] Wysłano listę ${trips.length} pending kursów do klienta ${client.id}`);
    } catch (error) {
      console.error('[WebSocket] Błąd pobierania pending trips:', error);
      client.emit('error', { message: 'Nie udało się pobrać listy kursów' });
    }
  }
}