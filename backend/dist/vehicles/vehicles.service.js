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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vehicle_entity_1 = require("./vehicle.entity");
const vehicle_log_entity_1 = require("./vehicle-log.entity");
let VehiclesService = class VehiclesService {
    vehicleRepository;
    vehicleLogRepository;
    constructor(vehicleRepository, vehicleLogRepository) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleLogRepository = vehicleLogRepository;
    }
    async findAll() {
        return this.vehicleRepository.find({
            relations: ['currentDriver'],
        });
    }
    async findOne(id) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id },
            relations: ['currentDriver', 'logs'],
        });
        if (!vehicle) {
            throw new common_1.NotFoundException(`Pojazd o id ${id} nie istnieje`);
        }
        return vehicle;
    }
    async create(vehicleData) {
        const newVehicle = this.vehicleRepository.create(vehicleData);
        return this.vehicleRepository.save(newVehicle);
    }
    async update(id, vehicleData) {
        await this.vehicleRepository.update(id, vehicleData);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.vehicleRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Pojazd o id ${id} nie istnieje`);
        }
    }
    async assignDriver(vehicleId, driverId) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Pojazd nie istnieje');
        }
        if (vehicle.status !== 'dostępny') {
            throw new Error('Pojazd nie jest dostępny');
        }
        vehicle.currentDriverId = driverId;
        vehicle.status = 'w użyciu';
        const updatedVehicle = await this.vehicleRepository.save(vehicle);
        const log = this.vehicleLogRepository.create({
            vehicleId: vehicle.id,
            driverId: driverId,
            eventType: 'rozpoczęcie_pracy',
            eventTime: new Date(),
            description: `Kierowca przypisany do pojazdu`,
        });
        await this.vehicleLogRepository.save(log);
        return this.findOne(vehicleId);
    }
    async releaseDriver(vehicleId) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Pojazd nie istnieje');
        }
        const driverId = vehicle.currentDriverId;
        vehicle.currentDriverId = null;
        vehicle.status = 'dostępny';
        const updatedVehicle = await this.vehicleRepository.save(vehicle);
        if (driverId) {
            const log = this.vehicleLogRepository.create({
                vehicleId: vehicle.id,
                driverId: driverId,
                eventType: 'zakończenie_pracy',
                eventTime: new Date(),
                description: `Kierowca zakończył pracę`,
            });
            await this.vehicleLogRepository.save(log);
        }
        return this.findOne(vehicleId);
    }
    async reportBreakdown(vehicleId, description, photoUrl) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Pojazd nie istnieje');
        }
        vehicle.isBreakdown = true;
        vehicle.status = 'niedostępny';
        const updatedVehicle = await this.vehicleRepository.save(vehicle);
        const log = this.vehicleLogRepository.create({
            vehicleId: vehicle.id,
            driverId: vehicle.currentDriverId,
            eventType: 'awaria',
            eventTime: new Date(),
            description: description,
            photoUrl: photoUrl,
        });
        await this.vehicleLogRepository.save(log);
        return this.findOne(vehicleId);
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vehicle_entity_1.Vehicle)),
    __param(1, (0, typeorm_1.InjectRepository)(vehicle_log_entity_1.VehicleLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map