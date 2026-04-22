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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trips_entity_1 = require("./trips.entity");
const trips_gateway_1 = require("./trips.gateway");
const driver_log_entity_1 = require("../users/driver-log.entity");
const user_entity_1 = require("../users/user.entity");
let TripsService = class TripsService {
    tripRepository;
    driverLogRepository;
    userRepository;
    tripsGateway;
    constructor(tripRepository, driverLogRepository, userRepository, tripsGateway) {
        this.tripRepository = tripRepository;
        this.driverLogRepository = driverLogRepository;
        this.userRepository = userRepository;
        this.tripsGateway = tripsGateway;
    }
    async requestTrip(clientId, data) {
        const trip = this.tripRepository.create({
            clientId,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            pickupAddress: data.pickupAddress,
            dropoffLat: data.dropoffLat,
            dropoffLng: data.dropoffLng,
            dropoffAddress: data.dropoffAddress,
            passengerCount: data.passengerCount || 1,
            notes: data.notes,
            status: 'pending',
        });
        const savedTrip = await this.tripRepository.save(trip);
        this.tripsGateway.broadcastNewTrip(savedTrip);
        return savedTrip;
    }
    async acceptTrip(tripId, driverId) {
        const trip = await this.tripRepository.findOne({
            where: { id: tripId }
        });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.status !== 'pending') {
            throw new Error('Kurs został już przyjęty przez innego kierowcę');
        }
        trip.driverId = driverId;
        trip.status = 'assigned';
        trip.assignedAt = new Date();
        const savedTrip = await this.tripRepository.save(trip);
        this.tripsGateway.broadcastTripAccepted(tripId);
        return savedTrip;
    }
    async getPendingTrips() {
        return this.tripRepository.find({
            where: { status: 'pending' },
            order: { requestedAt: 'DESC' },
        });
    }
    async startTrip(tripId, driverId, ipAddress, userAgent) {
        const trip = await this.tripRepository.findOne({ where: { id: tripId } });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.driverId !== driverId)
            throw new Error('Nie jesteś kierowcą tego kursu');
        const driver = await this.userRepository.findOne({ where: { id: driverId } });
        const driverEmail = driver?.email || `driver_${driverId}`;
        trip.status = 'in_progress';
        trip.startedAt = new Date();
        const savedTrip = await this.tripRepository.save(trip);
        this.tripsGateway.broadcastTripStatusChanged(tripId, 'in_progress');
        const log = this.driverLogRepository.create({
            driverId: driverId,
            eventType: 'rozpoczęcie_kursu',
            eventTime: new Date(),
            description: `Rozpoczęto kurs #${tripId} z adresu: ${trip.pickupAddress}`,
            relatedEntityType: 'trip',
            relatedEntityId: tripId,
            locationLat: trip.pickupLat,
            locationLng: trip.pickupLng,
            changedBy: driverEmail,
            ipAddress: ipAddress,
            userAgent: userAgent
        });
        await this.driverLogRepository.save(log);
        return savedTrip;
    }
    async completeTrip(tripId, driverId, ipAddress, userAgent) {
        const trip = await this.tripRepository.findOne({ where: { id: tripId } });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.driverId !== driverId)
            throw new Error('Nie jesteś kierowcą tego kursu');
        const driver = await this.userRepository.findOne({ where: { id: driverId } });
        const driverEmail = driver?.email || `driver_${driverId}`;
        trip.status = 'completed';
        trip.completedAt = new Date();
        const savedTrip = await this.tripRepository.save(trip);
        this.tripsGateway.broadcastTripStatusChanged(tripId, 'completed');
        const log = this.driverLogRepository.create({
            driverId: driverId,
            eventType: 'zakonczenie_kursu',
            eventTime: new Date(),
            description: `Zakończono kurs #${tripId} na adresie: ${trip.dropoffAddress}`,
            relatedEntityType: 'trip',
            relatedEntityId: tripId,
            locationLat: trip.dropoffLat,
            locationLng: trip.dropoffLng,
            changedBy: driverEmail,
            ipAddress: ipAddress,
            userAgent: userAgent
        });
        await this.driverLogRepository.save(log);
        return savedTrip;
    }
    async getDriverAssignedTrips(driverId) {
        return this.tripRepository.find({
            where: { driverId, status: 'assigned' },
            order: { requestedAt: 'ASC' },
        });
    }
    async getClientHistory(clientId) {
        return this.tripRepository.find({
            where: { clientId },
            order: { requestedAt: 'DESC' },
        });
    }
    async getTripDetails(tripId) {
        const trip = await this.tripRepository.findOne({
            where: { id: tripId },
            relations: ['client', 'driver', 'vehicle'],
        });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        return trip;
    }
    async getClientActiveTrip(clientId) {
        return this.tripRepository.findOne({
            where: {
                clientId,
                status: (0, typeorm_2.In)(['pending', 'assigned', 'in_progress']),
            },
            order: { requestedAt: 'DESC' },
        });
    }
    async cancelTrip(tripId, userId, reason) {
        const trip = await this.tripRepository.findOne({
            where: { id: tripId },
            relations: ['client']
        });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.clientId !== userId) {
            throw new Error('Nie masz uprawnień do anulowania tego kursu');
        }
        if (trip.status === 'completed') {
            throw new Error('Nie można anulować zakończonego kursu');
        }
        if (trip.status === 'in_progress') {
            throw new Error('Nie można anulować kursu w trakcie');
        }
        trip.status = 'cancelled';
        trip.cancelledAt = new Date();
        trip.cancellationReason = reason || 'Anulowane przez klienta';
        const savedTrip = await this.tripRepository.save(trip);
        this.tripsGateway.broadcastTripCancelled(tripId);
        return savedTrip;
    }
    async getDriverActiveTrip(driverId) {
        console.log(`🔍 getDriverActiveTrip - szukam dla driverId: ${driverId}`);
        const trip = await this.tripRepository.findOne({
            where: {
                driverId: driverId,
                status: (0, typeorm_2.In)(['assigned', 'in_progress']),
            },
            order: { assignedAt: 'DESC' },
        });
        console.log('📡 Znaleziony kurs:', trip);
        return trip;
    }
    async getAllTrips() {
        return this.tripRepository.find();
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trips_entity_1.Trip)),
    __param(1, (0, typeorm_1.InjectRepository)(driver_log_entity_1.DriverLog)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => trips_gateway_1.TripsGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        trips_gateway_1.TripsGateway])
], TripsService);
//# sourceMappingURL=trips.service.js.map