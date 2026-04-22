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
const driver_log_entity_1 = require("../users/driver-log.entity");
const user_entity_1 = require("../users/user.entity");
let VehiclesService = class VehiclesService {
    vehicleRepository;
    vehicleLogRepository;
    driverLogRepository;
    userRepository;
    constructor(vehicleRepository, vehicleLogRepository, driverLogRepository, userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleLogRepository = vehicleLogRepository;
        this.driverLogRepository = driverLogRepository;
        this.userRepository = userRepository;
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
    async getLogsByVehicle(vehicleId) {
        return this.vehicleLogRepository.find({
            where: { vehicleId },
            relations: ['driver'],
            order: { createdAt: 'DESC' }
        });
    }
    async getAllLogs() {
        return this.vehicleLogRepository.find({
            relations: ['vehicle', 'driver'],
            order: { createdAt: 'DESC' }
        });
    }
    async create(vehicleData, changedBy) {
        const newVehicle = this.vehicleRepository.create(vehicleData);
        const savedVehicle = await this.vehicleRepository.save(newVehicle);
        const log = this.vehicleLogRepository.create({
            vehicleId: savedVehicle.id,
            eventType: 'uwagi',
            eventTime: new Date(),
            description: `Pojazd został dodany do systemu. Rejestracja: ${savedVehicle.registration}, Marka/Model: ${savedVehicle.brand} ${savedVehicle.model}`,
            changedBy: changedBy || 'system',
        });
        await this.vehicleLogRepository.save(log);
        return savedVehicle;
    }
    async update(id, vehicleData, changedBy) {
        const oldVehicle = await this.findOne(id);
        await this.vehicleRepository.update(id, vehicleData);
        const updatedVehicle = await this.findOne(id);
        const changes = [];
        if (oldVehicle.registration !== updatedVehicle.registration) {
            changes.push(`rejestracja: ${oldVehicle.registration} → ${updatedVehicle.registration}`);
        }
        if (oldVehicle.brand !== updatedVehicle.brand) {
            changes.push(`marka: ${oldVehicle.brand} → ${updatedVehicle.brand}`);
        }
        if (oldVehicle.model !== updatedVehicle.model) {
            changes.push(`model: ${oldVehicle.model} → ${updatedVehicle.model}`);
        }
        if (oldVehicle.status !== updatedVehicle.status) {
            changes.push(`status: ${oldVehicle.status} → ${updatedVehicle.status}`);
        }
        if (oldVehicle.passengerCapacity !== updatedVehicle.passengerCapacity) {
            changes.push(`ilość miejsc: ${oldVehicle.passengerCapacity} → ${updatedVehicle.passengerCapacity}`);
        }
        if (oldVehicle.isBreakdown !== updatedVehicle.isBreakdown) {
            changes.push(`awaria: ${oldVehicle.isBreakdown ? 'tak' : 'nie'} → ${updatedVehicle.isBreakdown ? 'tak' : 'nie'}`);
        }
        if (changes.length > 0) {
            const log = this.vehicleLogRepository.create({
                vehicleId: id,
                eventType: 'uwagi',
                eventTime: new Date(),
                description: `Zmodyfikowano: ${changes.join(', ')}`,
                changedBy: changedBy || 'system',
            });
            await this.vehicleLogRepository.save(log);
        }
        return updatedVehicle;
    }
    async remove(id) {
        const result = await this.vehicleRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Pojazd o id ${id} nie istnieje`);
        }
    }
    async toggleBreakdown(id, isBreakdown, changedBy) {
        const vehicle = await this.findOne(id);
        await this.vehicleRepository.update(id, { isBreakdown });
        const updatedVehicle = await this.findOne(id);
        const log = this.vehicleLogRepository.create({
            vehicleId: id,
            driverId: vehicle.currentDriverId,
            eventType: 'awaria',
            eventTime: new Date(),
            description: isBreakdown ? 'Zgłoszono awarię pojazdu' : 'Usunięto zgłoszenie awarii',
            changedBy: changedBy || 'system',
        });
        await this.vehicleLogRepository.save(log);
        return updatedVehicle;
    }
    async reportBreakdown(vehicleId, description, changedBy, photoUrl) {
        const vehicle = await this.findOne(vehicleId);
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
            changedBy: changedBy || 'system',
        });
        await this.vehicleLogRepository.save(log);
        return this.findOne(vehicleId);
    }
    async assignDriver(vehicleId, driverId, changedBy, ipAddress, userAgent) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Pojazd nie istnieje');
        }
        if (vehicle.status !== 'dostępny') {
            throw new Error('Pojazd nie jest dostępny');
        }
        const driver = await this.userRepository.findOne({ where: { id: driverId } });
        const driverEmail = driver?.email || `driver_${driverId}`;
        const changedByEmail = changedBy || driverEmail;
        vehicle.currentDriverId = driverId;
        vehicle.status = 'w użyciu';
        const updatedVehicle = await this.vehicleRepository.save(vehicle);
        const vehicleLog = this.vehicleLogRepository.create({
            vehicleId: vehicle.id,
            driverId: driverId,
            eventType: 'rozpoczęcie_pracy',
            eventTime: new Date(),
            description: `Kierowca przypisany do pojazdu`,
            changedBy: changedByEmail,
        });
        await this.vehicleLogRepository.save(vehicleLog);
        const driverLog = this.driverLogRepository.create({
            driverId: driverId,
            eventType: 'przypisanie_pojazdu',
            eventTime: new Date(),
            description: `Przypisano pojazd: ${vehicle.registration} (${vehicle.brand} ${vehicle.model})`,
            relatedEntityType: 'vehicle',
            relatedEntityId: vehicleId,
            changedBy: changedByEmail,
            ipAddress: ipAddress,
            userAgent: userAgent
        });
        await this.driverLogRepository.save(driverLog);
        return this.findOne(vehicleId);
    }
    async releaseDriver(vehicleId, changedBy, ipAddress, userAgent) {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Pojazd nie istnieje');
        }
        const driverId = vehicle.currentDriverId;
        let driverEmail = 'system';
        if (driverId) {
            const driver = await this.userRepository.findOne({ where: { id: driverId } });
            driverEmail = driver?.email || `driver_${driverId}`;
        }
        const changedByEmail = changedBy || driverEmail;
        vehicle.currentDriverId = null;
        vehicle.status = 'dostępny';
        const updatedVehicle = await this.vehicleRepository.save(vehicle);
        if (driverId) {
            const vehicleLog = this.vehicleLogRepository.create({
                vehicleId: vehicle.id,
                driverId: driverId,
                eventType: 'zakończenie_pracy',
                eventTime: new Date(),
                description: `Kierowca zakończył pracę`,
                changedBy: changedByEmail,
            });
            await this.vehicleLogRepository.save(vehicleLog);
            const driverLog = this.driverLogRepository.create({
                driverId: driverId,
                eventType: 'odpiecie_pojazdu',
                eventTime: new Date(),
                description: `Odpięto pojazd: ${vehicle.registration} (${vehicle.brand} ${vehicle.model})`,
                relatedEntityType: 'vehicle',
                relatedEntityId: vehicleId,
                changedBy: changedByEmail,
                ipAddress: ipAddress,
                userAgent: userAgent
            });
            await this.driverLogRepository.save(driverLog);
        }
        return this.findOne(vehicleId);
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vehicle_entity_1.Vehicle)),
    __param(1, (0, typeorm_1.InjectRepository)(vehicle_log_entity_1.VehicleLog)),
    __param(2, (0, typeorm_1.InjectRepository)(driver_log_entity_1.DriverLog)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map