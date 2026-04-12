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
exports.VehiclesController = void 0;
const common_1 = require("@nestjs/common");
const vehicles_service_1 = require("./vehicles.service");
let VehiclesController = class VehiclesController {
    vehiclesService;
    constructor(vehiclesService) {
        this.vehiclesService = vehiclesService;
    }
    findAll() {
        return this.vehiclesService.findAll();
    }
    findOne(id) {
        return this.vehiclesService.findOne(id);
    }
    create(vehicleData, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.create(vehicleData, changedBy);
    }
    update(id, vehicleData, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.update(id, vehicleData, changedBy);
    }
    remove(id, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.remove(id);
    }
    getLogsByVehicle(vehicleId) {
        return this.vehiclesService.getLogsByVehicle(vehicleId);
    }
    getAllLogs() {
        return this.vehiclesService.getAllLogs();
    }
    toggleBreakdown(id, body, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.toggleBreakdown(id, body.isBreakdown, changedBy);
    }
    assignDriver(id, driverId, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.assignDriver(id, driverId, changedBy);
    }
    releaseDriver(id, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.releaseDriver(id, changedBy);
    }
    reportBreakdown(id, body, req) {
        const changedBy = req.headers['x-changed-by'] || 'system';
        return this.vehiclesService.reportBreakdown(id, body.description, changedBy, body.photoUrl);
    }
};
exports.VehiclesController = VehiclesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('vehicle-logs/vehicle/:vehicleId'),
    __param(0, (0, common_1.Param)('vehicleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "getLogsByVehicle", null);
__decorate([
    (0, common_1.Get)('vehicle-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "getAllLogs", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-breakdown'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "toggleBreakdown", null);
__decorate([
    (0, common_1.Patch)(':id/assign-driver/:driverId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('driverId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "assignDriver", null);
__decorate([
    (0, common_1.Patch)(':id/release-driver'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "releaseDriver", null);
__decorate([
    (0, common_1.Post)(':id/report-breakdown'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "reportBreakdown", null);
exports.VehiclesController = VehiclesController = __decorate([
    (0, common_1.Controller)('vehicles'),
    __metadata("design:paramtypes", [vehicles_service_1.VehiclesService])
], VehiclesController);
//# sourceMappingURL=vehicles.controller.js.map