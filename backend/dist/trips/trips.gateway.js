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
    constructor(tripsService) {
        this.tripsService = tripsService;
    }
    handleConnection(client) {
        console.log(`[WebSocket] Podłączono klienta: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[WebSocket] Odłączono klienta: ${client.id}`);
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
    async handleGetPendingTrips(client) {
        try {
            const trips = await this.tripsService.getPendingTrips();
            client.emit('pendingTrips', trips);
            console.log(`[WebSocket] Wysłano listę ${trips.length} pending kursów do klienta ${client.id}`);
        }
        catch (error) {
            console.error('[WebSocket] Błąd pobierania pending trips:', error);
            client.emit('error', { message: 'Nie udało się pobrać listy kursów' });
        }
    }
};
exports.TripsGateway = TripsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TripsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('getPendingTrips'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], TripsGateway.prototype, "handleGetPendingTrips", null);
exports.TripsGateway = TripsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: '*' }),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => trips_service_1.TripsService))),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsGateway);
//# sourceMappingURL=trips.gateway.js.map