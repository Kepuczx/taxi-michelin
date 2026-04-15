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
let TripsService = class TripsService {
    tripRepository;
    tripsGateway;
    constructor(tripRepository, tripsGateway) {
        this.tripRepository = tripRepository;
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
        const trip = await this.tripRepository.findOne({ where: { id: tripId } });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
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
    async startTrip(tripId, driverId) {
        const trip = await this.tripRepository.findOne({ where: { id: tripId } });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.driverId !== driverId)
            throw new Error('Nie jesteś kierowcą tego kursu');
        trip.status = 'in_progress';
        trip.startedAt = new Date();
        return this.tripRepository.save(trip);
    }
    async completeTrip(tripId, driverId) {
        const trip = await this.tripRepository.findOne({ where: { id: tripId } });
        if (!trip)
            throw new common_1.NotFoundException('Kurs nie istnieje');
        if (trip.driverId !== driverId)
            throw new Error('Nie jesteś kierowcą tego kursu');
        trip.status = 'completed';
        trip.completedAt = new Date();
        return this.tripRepository.save(trip);
    }
    async getDriverActiveTrips(driverId) {
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
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trips_entity_1.Trip)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        trips_gateway_1.TripsGateway])
], TripsService);
//# sourceMappingURL=trips.service.js.map