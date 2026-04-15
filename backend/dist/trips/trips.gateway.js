"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const trips_service_1 = require("./trips.service");
let TripsGateway = class TripsGateway {
    tripsService;
    server;
    tripRooms = new Map();
    constructor(tripsService) {
        this.tripsService = tripsService;
    }
    handleConnection(client) {
        console.log(`[WebSocket] Podłączono klienta: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[WebSocket] Odłączono klienta: ${client.id}`);
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
    handleJoinTripRoom(client, tripId) {
        const roomName = `trip:${tripId}`;
        client.join(roomName);
        if (!this.tripRooms.has(tripId)) {
            this.tripRooms.set(tripId, new Set());
        }
        this.tripRooms.get(tripId).add(client.id);
        console.log(`[WebSocket] Klient ${client.id} dołączył do roomu ${roomName}`);
        client.emit('joinedTripRoom', { tripId, success: true });
    }
    handleLeaveTripRoom(client, tripId) {
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
    handleDriverLocation(client, data) {
        const roomName = `trip:${data.tripId}`;
        console.log(`[WebSocket] Lokalizacja kierowcy dla kursu ${data.tripId}:`, data.location);
        client.to(roomName).emit('driverLocation', {
            tripId: data.tripId,
            location: data.location,
            timestamp: new Date().toISOString()
        });
    }
    broadcastNewTrip(trip) {
        this.server.emit('newTrip', trip);
        console.log(`[WebSocket] Wysłano powiadomienie o nowym kursie #${trip.id}`);
    }
    broadcastTripAccepted(tripId) {
        this.server.emit('tripAccepted', tripId);
        console.log(`[WebSocket] Kurs #${tripId} zniknął z giełdy (został przyjęty)`);
    }
    broadcastTripCancelled(tripId) {
        this.server.emit('tripCancelled', tripId);
        console.log(`[WebSocket] Kurs #${tripId} został anulowany`);
    }
    broadcastTripStatusChanged(tripId, status) {
        this.server.emit(`tripStatusChanged:${tripId}`, { tripId, status });
        console.log(`[WebSocket] Status kursu #${tripId} zmieniony na: ${status}`);
    }
};
exports.TripsGateway = TripsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TripsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinTripRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], TripsGateway.prototype, "handleJoinTripRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveTripRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], TripsGateway.prototype, "handleLeaveTripRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('driverLocation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TripsGateway.prototype, "handleDriverLocation", null);
exports.TripsGateway = TripsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: '*' }),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => trips_service_1.TripsService))),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsGateway);
//# sourceMappingURL=trips.gateway.js.map