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
exports.Vehicle = void 0;
const typeorm_1 = require("typeorm");
const vehicle_log_entity_1 = require("./vehicle-log.entity");
const user_entity_1 = require("../users/user.entity");
let Vehicle = class Vehicle {
    id;
    registration;
    brand;
    model;
    passengerCapacity;
    status;
    currentDriverId;
    currentDriver;
    isBreakdown;
    notes;
    logs;
    createdAt;
    updatedAt;
};
exports.Vehicle = Vehicle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Vehicle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "registration", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Vehicle.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Vehicle.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'passenger_capacity' }),
    __metadata("design:type", Number)
], Vehicle.prototype, "passengerCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['dostępny', 'w użyciu', 'niedostępny'],
        default: 'dostępny'
    }),
    __metadata("design:type", String)
], Vehicle.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_driver_id', nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], Vehicle.prototype, "currentDriverId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'current_driver_id' }),
    __metadata("design:type", user_entity_1.User)
], Vehicle.prototype, "currentDriver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_breakdown', default: false }),
    __metadata("design:type", Boolean)
], Vehicle.prototype, "isBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vehicle_log_entity_1.VehicleLog, log => log.vehicle),
    __metadata("design:type", Array)
], Vehicle.prototype, "logs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Vehicle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Vehicle.prototype, "updatedAt", void 0);
exports.Vehicle = Vehicle = __decorate([
    (0, typeorm_1.Entity)('vehicles')
], Vehicle);
//# sourceMappingURL=vehicle.entity.js.map