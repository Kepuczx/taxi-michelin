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
exports.VehicleLog = void 0;
const typeorm_1 = require("typeorm");
const vehicle_entity_1 = require("./vehicle.entity");
const user_entity_1 = require("../users/user.entity");
let VehicleLog = class VehicleLog {
    id;
    vehicle;
    vehicleId;
    driver;
    driverId;
    eventType;
    eventTime;
    passengersCount;
    description;
    photoUrl;
    startLocation;
    endLocation;
    distanceKm;
    createdAt;
};
exports.VehicleLog = VehicleLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], VehicleLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehicle_entity_1.Vehicle, vehicle => vehicle.logs),
    (0, typeorm_1.JoinColumn)({ name: 'vehicle_id' }),
    __metadata("design:type", vehicle_entity_1.Vehicle)
], VehicleLog.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_id' }),
    __metadata("design:type", Number)
], VehicleLog.prototype, "vehicleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], VehicleLog.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_id', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], VehicleLog.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['rozpoczęcie_pracy', 'zakończenie_pracy', 'przejazd', 'uwagi', 'awaria']
    }),
    __metadata("design:type", String)
], VehicleLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_time' }),
    __metadata("design:type", Date)
], VehicleLog.prototype, "eventTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'passengers_count', nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], VehicleLog.prototype, "passengersCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VehicleLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'photo_url', nullable: true, length: 500 }),
    __metadata("design:type", String)
], VehicleLog.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_location', nullable: true, length: 255 }),
    __metadata("design:type", String)
], VehicleLog.prototype, "startLocation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_location', nullable: true, length: 255 }),
    __metadata("design:type", String)
], VehicleLog.prototype, "endLocation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distance_km', nullable: true, type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VehicleLog.prototype, "distanceKm", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VehicleLog.prototype, "createdAt", void 0);
exports.VehicleLog = VehicleLog = __decorate([
    (0, typeorm_1.Entity)('vehicle_logs')
], VehicleLog);
//# sourceMappingURL=vehicle-log.entity.js.map