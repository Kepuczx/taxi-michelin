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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trip = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const vehicle_entity_1 = require("../vehicles/vehicle.entity");
let Trip = class Trip {
    id;
    client;
    clientId;
    driver;
    driverId;
    vehicle;
    vehicleId;
    pickupLat;
    pickupLng;
    pickupAddress;
    dropoffLat;
    dropoffLng;
    dropoffAddress;
    routePolyline;
    distanceKm;
    durationMin;
    status;
    requestedAt;
    assignedAt;
    startedAt;
    completedAt;
    cancelledAt;
    passengerCount;
    notes;
    cancellationReason;
    createdAt;
    updatedAt;
};
exports.Trip = Trip;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Trip.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", user_entity_1.User)
], Trip.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", Number)
], Trip.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], Trip.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_id', nullable: true }),
    __metadata("design:type", Number)
], Trip.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehicle_entity_1.Vehicle),
    (0, typeorm_1.JoinColumn)({ name: 'vehicle_id' }),
    __metadata("design:type", vehicle_entity_1.Vehicle)
], Trip.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_id', nullable: true }),
    __metadata("design:type", Number)
], Trip.prototype, "vehicleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, name: 'pickup_lat' }),
    __metadata("design:type", Number)
], Trip.prototype, "pickupLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, name: 'pickup_lng' }),
    __metadata("design:type", Number)
], Trip.prototype, "pickupLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pickup_address', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Trip.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, name: 'dropoff_lat', nullable: true }),
    __metadata("design:type", Number)
], Trip.prototype, "dropoffLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, name: 'dropoff_lng', nullable: true }),
    __metadata("design:type", Number)
], Trip.prototype, "dropoffLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dropoff_address', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Trip.prototype, "dropoffAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'route_polyline', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Trip.prototype, "routePolyline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distance_km', nullable: true, type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Trip.prototype, "distanceKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_min', nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], Trip.prototype, "durationMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], Trip.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Trip.prototype, "requestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Trip.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Trip.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Trip.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], Trip.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'passenger_count', default: 1 }),
    __metadata("design:type", Number)
], Trip.prototype, "passengerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Trip.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancellation_reason', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Trip.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Trip.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Trip.prototype, "updatedAt", void 0);
exports.Trip = Trip = __decorate([
    (0, typeorm_1.Entity)('trips')
], Trip);
//# sourceMappingURL=trips.entity.js.map