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
exports.TripsController = void 0;
const common_1 = require("@nestjs/common");
const trips_service_1 = require("./trips.service");
let TripsController = class TripsController {
    tripsService;
    constructor(tripsService) {
        this.tripsService = tripsService;
    }
    async requestTrip(data) {
        return this.tripsService.requestTrip(data.clientId, data);
    }
    async getClientHistory(clientId) {
        return this.tripsService.getClientHistory(+clientId);
    }
    async acceptTrip(id, driverId, driverLat, driverLng, driverAddress) {
        return this.tripsService.acceptTrip(+id, driverId, driverLat, driverLng, driverAddress);
    }
    async getDriverAssignedTrips(driverId) {
        return this.tripsService.getDriverAssignedTrips(+driverId);
    }
    async getDriverActiveTrip(driverId) {
        return this.tripsService.getDriverActiveTrip(+driverId);
    }
    async startTrip(id, driverId, req) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.tripsService.startTrip(+id, driverId, ipAddress, userAgent);
    }
    async completeTrip(id, driverId, req) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.tripsService.completeTrip(+id, driverId, ipAddress, userAgent);
    }
    async getPendingTrips() {
        return this.tripsService.getPendingTrips();
    }
    async getClientActiveTrip(clientId) {
        return this.tripsService.getClientActiveTrip(+clientId);
    }
    async cancelTrip(id, reason, userId) {
        return this.tripsService.cancelTrip(+id, userId, reason);
    }
    async getAllTrips() {
        return this.tripsService.getAllTrips();
    }
    async getDriverHistory(driverId) {
        return this.tripsService.getDriverHistory(+driverId);
    }
    async getDriverStats(driverId) {
        return this.tripsService.getDriverStats(+driverId);
    }
};
exports.TripsController = TripsController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "requestTrip", null);
__decorate([
    (0, common_1.Get)('client/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getClientHistory", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Body)('driverLat')),
    __param(3, (0, common_1.Body)('driverLng')),
    __param(4, (0, common_1.Body)('driverAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "acceptTrip", null);
__decorate([
    (0, common_1.Get)('driver/:driverId/assigned'),
    __param(0, (0, common_1.Param)('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getDriverAssignedTrips", null);
__decorate([
    (0, common_1.Get)('driver/:driverId/active'),
    __param(0, (0, common_1.Param)('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getDriverActiveTrip", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "startTrip", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "completeTrip", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getPendingTrips", null);
__decorate([
    (0, common_1.Get)('client/:clientId/active'),
    __param(0, (0, common_1.Param)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getClientActiveTrip", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "cancelTrip", null);
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getAllTrips", null);
__decorate([
    (0, common_1.Get)('driver/:driverId/history'),
    __param(0, (0, common_1.Param)('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getDriverHistory", null);
__decorate([
    (0, common_1.Get)('driver/:driverId/stats'),
    __param(0, (0, common_1.Param)('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getDriverStats", null);
exports.TripsController = TripsController = __decorate([
    (0, common_1.Controller)('trips'),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsController);
//# sourceMappingURL=trips.controller.js.map