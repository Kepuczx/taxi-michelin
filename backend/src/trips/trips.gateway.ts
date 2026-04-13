import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Trip } from './trips.entity';

// cors: '*' jest niezbędne, aby aplikacja mobilna z innego IP mogła się połączyć
@WebSocketGateway({ cors: '*' })
export class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Funkcja odpala się automatycznie, gdy np. aplikacja kierowcy nawiąże połączenie
  handleConnection(client: Socket) {
    console.log(`[WebSocket] Podłączono klienta: ${client.id}`);
  }

  // Funkcja odpala się, gdy kierowca zamknie aplikację lub straci zasięg
  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Odłączono klienta: ${client.id}`);
  }

  // 🔥 Ta funkcja zostanie wywołana z trips.service.ts
  broadcastNewTrip(trip: Trip) {
    // Wysyła sygnał o nazwie 'newTrip' do wszystkich podłączonych urządzeń
    this.server.emit('newTrip', trip);
    console.log(`[WebSocket] Wysłano powiadomienie o nowym kursie #${trip.id}`);
  }
}
