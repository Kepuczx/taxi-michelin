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
exports.DriverLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let DriverLog = class DriverLog {
    id;
    driver;
    driverId;
    eventType;
    eventTime;
    locationLat;
    locationLng;
    locationAddress;
    description;
    relatedEntityType;
    relatedEntityId;
    changedBy;
    oldValues;
    newValues;
    ipAddress;
    userAgent;
    createdAt;
};
exports.DriverLog = DriverLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", user_entity_1.User)
], DriverLog.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_id' }),
    __metadata("design:type", Number)
], DriverLog.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'logowanie',
            'wylogowanie',
            'zmiana_statusu',
            'przypisanie_pojazdu',
            'odpiecie_pojazdu',
            'rozpoczęcie_kursu',
            'zakonczenie_kursu',
            'aktualizacja_lokalizacji',
            'edycja_profilu',
            'zmiana_hasla',
            'blokada_konta',
            'odblokowanie_konta'
        ]
    }),
    __metadata("design:type", String)
], DriverLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_time' }),
    __metadata("design:type", Date)
], DriverLog.prototype, "eventTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_lat', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], DriverLog.prototype, "locationLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_lng', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], DriverLog.prototype, "locationLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_address', nullable: true, length: 255 }),
    __metadata("design:type", String)
], DriverLog.prototype, "locationAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DriverLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'related_entity_type', nullable: true, length: 50 }),
    __metadata("design:type", String)
], DriverLog.prototype, "relatedEntityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'related_entity_id', nullable: true }),
    __metadata("design:type", Number)
], DriverLog.prototype, "relatedEntityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changed_by', nullable: true, length: 100 }),
    __metadata("design:type", String)
], DriverLog.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_values', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DriverLog.prototype, "oldValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_values', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DriverLog.prototype, "newValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true, length: 45 }),
    __metadata("design:type", String)
], DriverLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', nullable: true, length: 255 }),
    __metadata("design:type", String)
], DriverLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DriverLog.prototype, "createdAt", void 0);
exports.DriverLog = DriverLog = __decorate([
    (0, typeorm_1.Entity)('driver_logs')
], DriverLog);
//# sourceMappingURL=driver-log.entity.js.map