import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Trip } from './trips.entity';
import { TripsGateway } from './trips.gateway';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @Inject(forwardRef(() => TripsGateway))
    private readonly tripsGateway: TripsGateway,
  ) {}

  async requestTrip(clientId: number, data: any): Promise<Trip> {
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

  async acceptTrip(tripId: number, driverId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId }
    });
    
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    
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

  async getPendingTrips(): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { status: 'pending' },
      order: { requestedAt: 'DESC' },
    });
  }

  async startTrip(tripId: number, driverId: number): Promise<Trip> {
  const trip = await this.tripRepository.findOne({ where: { id: tripId } });
  if (!trip) throw new NotFoundException('Kurs nie istnieje');
  if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
  
  trip.status = 'in_progress';
  trip.startedAt = new Date();
  const savedTrip = await this.tripRepository.save(trip);
  
  // 🔥 DODAJ TO - powiadom klienta o zmianie statusu
  this.tripsGateway.broadcastTripStatusChanged(tripId, 'in_progress');
  
  return savedTrip;
}

async completeTrip(tripId: number, driverId: number): Promise<Trip> {
  const trip = await this.tripRepository.findOne({ where: { id: tripId } });
  if (!trip) throw new NotFoundException('Kurs nie istnieje');
  if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
  
  trip.status = 'completed';
  trip.completedAt = new Date();
  const savedTrip = await this.tripRepository.save(trip);
  
  // 🔥 DODAJ TO - powiadom klienta o zmianie statusu
  this.tripsGateway.broadcastTripStatusChanged(tripId, 'completed');
  
  return savedTrip;
}

  async getDriverAssignedTrips(driverId: number): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { driverId, status: 'assigned' },
      order: { requestedAt: 'ASC' },
    });
  }

  async getClientHistory(clientId: number): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { clientId },
      order: { requestedAt: 'DESC' },
    });
  }

  async getTripDetails(tripId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['client', 'driver', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    return trip;
  }

  async getClientActiveTrip(clientId: number): Promise<Trip | null> {
    return this.tripRepository.findOne({
      where: {
        clientId,
        status: In(['pending', 'assigned', 'in_progress']),
      },
      order: { requestedAt: 'DESC' },
    });
  }

  async cancelTrip(tripId: number, userId: number, reason?: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ 
      where: { id: tripId },
      relations: ['client']
    });
    
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    
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

  // 🔥 Pobierz aktywny kurs kierowcy (assigned lub in_progress) - TYLKO JEDNA WERSJA!
  async getDriverActiveTrip(driverId: number): Promise<Trip | null> {
  console.log(`🔍 getDriverActiveTrip - szukam dla driverId: ${driverId}`);
  
  const trip = await this.tripRepository.findOne({
    where: {
      driverId: driverId,
      status: In(['assigned', 'in_progress']),
    },
    order: { assignedAt: 'DESC' },
  });
  
  console.log('📡 Znaleziony kurs:', trip);
  return trip;
}

  // 🔥 TEST: Pobierz wszystkie kursy
  async getAllTrips(): Promise<Trip[]> {
    return this.tripRepository.find();
  }
}