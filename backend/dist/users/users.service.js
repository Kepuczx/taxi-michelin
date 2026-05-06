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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const driver_log_entity_1 = require("./driver-log.entity");
let UsersService = class UsersService {
    usersRepository;
    driverLogRepository;
    constructor(usersRepository, driverLogRepository) {
        this.usersRepository = usersRepository;
        this.driverLogRepository = driverLogRepository;
    }
    findAll() {
        return this.usersRepository.find();
    }
    async findOne(id) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new common_1.NotFoundException(`Użytkownik o id ${id} nie istnieje`);
        }
        return user;
    }
    async create(userData) {
        const existingUser = await this.usersRepository.findOneBy({
            email: userData.email
        });
        if (existingUser) {
            throw new Error('Użytkownik z tym emailem już istnieje');
        }
        const newUser = this.usersRepository.create(userData);
        const savedUser = await this.usersRepository.save(newUser);
        if (savedUser.role === 'driver') {
            const log = this.driverLogRepository.create({
                driverId: savedUser.id,
                eventType: 'edycja_profilu',
                eventTime: new Date(),
                description: `Utworzono konto kierowcy: ${savedUser.firstName} ${savedUser.lastName}`,
                changedBy: 'system',
                newValues: { email: savedUser.email, firstName: savedUser.firstName, lastName: savedUser.lastName }
            });
            await this.driverLogRepository.save(log);
        }
        return savedUser;
    }
    async update(id, userData) {
        await this.usersRepository.update(id, userData);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Użytkownik o id ${id} nie istnieje`);
        }
    }
    async getDriverLogs(driverId) {
        return this.driverLogRepository.find({
            where: { driverId },
            order: { eventTime: 'DESC' }
        });
    }
    async getAllDriverLogs() {
        return this.driverLogRepository.find({
            relations: ['driver'],
            order: { eventTime: 'DESC' }
        });
    }
    async updateDriverStatus(driverId, isOnline, lat, lng, changedBy, ipAddress, userAgent) {
        console.log(`📡 updateDriverStatus: driverId=${driverId}, isOnline=${isOnline}`);
        const driver = await this.findOne(driverId);
        if (driver.role !== 'driver') {
            throw new common_1.BadRequestException('Tylko kierowcy mogą zmieniać status online/offline');
        }
        const oldStatus = driver.isOnline;
        await this.usersRepository.update(driverId, {
            isOnline: isOnline,
            ...(lat !== undefined && lng !== undefined ? { currentLat: lat, currentLng: lng } : {})
        });
        const updatedDriver = await this.findOne(driverId);
        console.log(`✅ Status zaktualizowany: ${oldStatus} -> ${updatedDriver.isOnline}`);
        const log = this.driverLogRepository.create({
            driverId,
            eventType: 'zmiana_statusu',
            eventTime: new Date(),
            locationLat: lat,
            locationLng: lng,
            description: `Zmiana statusu z ${oldStatus ? 'online' : 'offline'} na ${isOnline ? 'online' : 'offline'}`,
            changedBy: changedBy || driver.email,
            oldValues: { isOnline: oldStatus },
            newValues: { isOnline },
            ipAddress,
            userAgent
        });
        await this.driverLogRepository.save(log);
        return updatedDriver;
    }
    async updateDriverLocation(driverId, lat, lng, address) {
        const driver = await this.findOne(driverId);
        if (driver.role !== 'driver') {
            throw new common_1.BadRequestException('Tylko kierowcy mogą aktualizować lokalizację');
        }
        await this.usersRepository.update(driverId, { currentLat: lat, currentLng: lng });
        return this.findOne(driverId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(driver_log_entity_1.DriverLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map