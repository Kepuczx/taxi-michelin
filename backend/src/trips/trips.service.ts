import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Trip } from './trips.entity';
import { TripsGateway } from './trips.gateway';
import { DriverLog } from '../users/driver-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(DriverLog)
    private driverLogRepository: Repository<DriverLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async acceptTrip(tripId: number, driverId: number, driverLat?: number, driverLng?: number, driverAddress?: string): Promise<Trip> {
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
  
  // 🔥 ZAPISZ LOKALIZACJĘ STARTU KIEROWCY
  if (driverLat && driverLng) {
    trip.driverStartLat = driverLat;
    trip.driverStartLng = driverLng;
    trip.driverStartAddress = driverAddress || '';
  }
  
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

  async startTrip(tripId: number, driverId: number, ipAddress?: string, userAgent?: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
    
    // Pobierz email kierowcy
    const driver = await this.userRepository.findOne({ where: { id: driverId } });
    const driverEmail = driver?.email || `driver_${driverId}`;
    
    trip.status = 'in_progress';
    trip.startedAt = new Date();
    const savedTrip = await this.tripRepository.save(trip);
    
    // 🔥 DODAJ TO - powiadom klienta o zmianie statusu
    this.tripsGateway.broadcastTripStatusChanged(tripId, 'in_progress');
    
    // 🔥 LOG DLA KIEROWCY - rozpoczęcie kursu
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

  async completeTrip(tripId: number, driverId: number, ipAddress?: string, userAgent?: string): Promise<Trip> {
  const trip = await this.tripRepository.findOne({ where: { id: tripId } });
  if (!trip) throw new NotFoundException('Kurs nie istnieje');
  if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
  
  // Pobierz email kierowcy
  const driver = await this.userRepository.findOne({ where: { id: driverId } });
  const driverEmail = driver?.email || `driver_${driverId}`;
  
  // 🔥 FUNKCJA DO OBLICZANIA DYSTANSU (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // 🔥 OBLICZ DYSTANSY
  let distanceToPickupKm = 0;
  let distanceTripKm = 0;
  let totalDistanceKm = 0;
  
  // 1. Dystans od startu kierowcy do pickupu (jeśli dane istnieją)
  if (trip.driverStartLat && trip.driverStartLng && trip.pickupLat && trip.pickupLng) {
    distanceToPickupKm = calculateDistance(
      Number(trip.driverStartLat), Number(trip.driverStartLng),
      Number(trip.pickupLat), Number(trip.pickupLng)
    );
    totalDistanceKm += distanceToPickupKm;
  }
  
  // 2. Dystans od pickupu do dropoffu (jeśli dane istnieją)
  if (trip.pickupLat && trip.pickupLng && trip.dropoffLat && trip.dropoffLng) {
    distanceTripKm = calculateDistance(
      Number(trip.pickupLat), Number(trip.pickupLng),
      Number(trip.dropoffLat), Number(trip.dropoffLng)
    );
    totalDistanceKm += distanceTripKm;
  }
  
  // 🔥 ZAPISZ DYSTANSY W BAZIE
  trip.distanceToPickupKm = distanceToPickupKm;
  trip.distanceTripKm = distanceTripKm;
  trip.totalDistanceKm = totalDistanceKm;
  trip.distanceKm = totalDistanceKm; // Dla kompatybilności ze starym kodem
  trip.status = 'completed';
  trip.completedAt = new Date();
  
  const savedTrip = await this.tripRepository.save(trip);
  
  console.log(`📊 Kurs #${tripId} - Dystans do klienta: ${distanceToPickupKm.toFixed(2)} km, Kurs z klientem: ${distanceTripKm.toFixed(2)} km, Razem: ${totalDistanceKm.toFixed(2)} km`);
  
  // 🔥 LOG DLA KIEROWCY - zakończenie kursu z dystansami
  const log = this.driverLogRepository.create({
    driverId: driverId,
    eventType: 'zakonczenie_kursu',
    eventTime: new Date(),
    description: `Zakończono kurs #${tripId}. Dojazd: ${distanceToPickupKm.toFixed(2)} km, Kurs: ${distanceTripKm.toFixed(2)} km, Razem: ${totalDistanceKm.toFixed(2)} km`,
    relatedEntityType: 'trip',
    relatedEntityId: tripId,
    locationLat: trip.dropoffLat,
    locationLng: trip.dropoffLng,
    changedBy: driverEmail,
    ipAddress: ipAddress,
    userAgent: userAgent
  });
  await this.driverLogRepository.save(log);
  
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
      relations: ['driver', 'vehicle'],
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

  async getDriverHistory(driverId: number): Promise<Trip[]> {
  return this.tripRepository.find({
    where: { 
      driverId: driverId,
      status: In(['completed', 'cancelled'])
    },
    order: { completedAt: 'DESC', cancelledAt: 'DESC' },
    relations: ['vehicle']
  });
}
  async getDriverStats(driverId: number): Promise<any> {
  const trips = await this.tripRepository.find({
    where: { 
      driverId: driverId,
      status: 'completed'
    }
  });
  
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.totalDistanceKm || 0), 0);
  const totalTrips = trips.length;
  const totalDistanceToPickup = trips.reduce((sum, trip) => sum + (trip.distanceToPickupKm || 0), 0);
  const totalDistanceTrip = trips.reduce((sum, trip) => sum + (trip.distanceTripKm || 0), 0);
  
  return {
    totalTrips,
    totalDistance: totalDistance.toFixed(2),
    totalDistanceToPickup: totalDistanceToPickup.toFixed(2),
    totalDistanceTrip: totalDistanceTrip.toFixed(2),
    averageDistance: trips.length > 0 ? (totalDistance / trips.length).toFixed(2) : 0
  };
}
}