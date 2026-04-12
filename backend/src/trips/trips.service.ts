import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './trips.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
  ) {}

  // Klient zamawia kurs
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
    return this.tripRepository.save(trip);
  }

  // Kierowca przyjmuje kurs
  async acceptTrip(tripId: number, driverId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    
    trip.driverId = driverId;
    trip.status = 'assigned';
    trip.assignedAt = new Date();
    return this.tripRepository.save(trip);
  }

  // Rozpoczęcie kursu
  async startTrip(tripId: number, driverId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
    
    trip.status = 'in_progress';
    trip.startedAt = new Date();
    return this.tripRepository.save(trip);
  }

  // Zakończenie kursu
  async completeTrip(tripId: number, driverId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    if (trip.driverId !== driverId) throw new Error('Nie jesteś kierowcą tego kursu');
    
    trip.status = 'completed';
    trip.completedAt = new Date();
    return this.tripRepository.save(trip);
  }

  // Pobierz aktywne kursy dla kierowcy
  async getDriverActiveTrips(driverId: number): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { driverId, status: 'assigned' },
      order: { requestedAt: 'ASC' },
    });
  }

  // Pobierz historię kursów klienta
  async getClientHistory(clientId: number): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { clientId },
      order: { requestedAt: 'DESC' },
    });
  }

  // Pobierz szczegóły kursu
  async getTripDetails(tripId: number): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['client', 'driver', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Kurs nie istnieje');
    return trip;
  }
}