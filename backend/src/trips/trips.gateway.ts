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

  // Przechowywanie połączeń (roomy dla tripów)
  private tripRooms: Map<number, Set<string>> = new Map();

  constructor(
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Podłączono klienta: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Odłączono klienta: ${client.id}`);
    
    // Usuń klienta ze wszystkich roomów
    for (const [tripId, clients] of this.tripRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.tripRooms.delete(tripId);
        }
        break;
      }
    }
  }

  // Dołącz do roomu danego kursu
  @SubscribeMessage('joinTripRoom')
  handleJoinTripRoom(client: Socket, tripId: number) {
    const roomName = `trip:${tripId}`;
    client.join(roomName);
    
    if (!this.tripRooms.has(tripId)) {
      this.tripRooms.set(tripId, new Set());
    }
    this.tripRooms.get(tripId)!.add(client.id);
    
    console.log(`[WebSocket] Klient ${client.id} dołączył do roomu ${roomName}`);
    client.emit('joinedTripRoom', { tripId, success: true });
  }

  // Opuszczenie roomu
  @SubscribeMessage('leaveTripRoom')
  handleLeaveTripRoom(client: Socket, tripId: number) {
    const roomName = `trip:${tripId}`;
    client.leave(roomName);
    
    const clients = this.tripRooms.get(tripId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.tripRooms.delete(tripId);
      }
    }
    
    console.log(`[WebSocket] Klient ${client.id} opuścił room ${roomName}`);
  }

  // 🔥 KIEROWCA: wysyła lokalizację
  @SubscribeMessage('driverLocation')
  handleDriverLocation(client: Socket, data: { tripId: number; location: { lat: number; lng: number } }) {
    const roomName = `trip:${data.tripId}`;
    console.log(`[WebSocket] Lokalizacja kierowcy dla kursu ${data.tripId}:`, data.location);
    
    // Wyślij do wszystkich w roomie (oprócz nadawcy)
    client.to(roomName).emit('driverLocation', {
      tripId: data.tripId,
      location: data.location,
      timestamp: new Date().toISOString()
    });
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

  // Dodaj tę metodę w TripsGateway
broadcastTripStatusChanged(tripId: number, status: string) {
  this.server.emit(`tripStatusChanged:${tripId}`, { tripId, status });
  console.log(`[WebSocket] Status kursu #${tripId} zmieniony na: ${status}`);
}
}