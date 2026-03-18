import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleLog } from './vehicle-log.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleLog)
    private vehicleLogRepository: Repository<VehicleLog>,
  ) {}

  // Pobierz wszystkie pojazdy (opcjonalnie z kierowcami)
  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['currentDriver'], // ← ładuje dane kierowcy
    });
  }

  // Pobierz jeden pojazd
  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['currentDriver', 'logs'], // ← ładuje kierowcę i logi
    });
    if (!vehicle) {
      throw new NotFoundException(`Pojazd o id ${id} nie istnieje`);
    }
    return vehicle;
  }

  // Tworzenie pojazdu
  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const newVehicle = this.vehicleRepository.create(vehicleData);
    return this.vehicleRepository.save(newVehicle);
  }

  // Aktualizacja pojazdu
  async update(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    await this.vehicleRepository.update(id, vehicleData);
    return this.findOne(id);
  }

  // Usuwanie pojazdu
  async remove(id: number): Promise<void> {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pojazd o id ${id} nie istnieje`);
    }
  }

  // 🔥 PRZYPISZ KIEROWCĘ DO POJAZDU
  async assignDriver(vehicleId: number, driverId: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
    }

    // Sprawdź czy pojazd jest dostępny
    if (vehicle.status !== 'dostępny') {
      throw new Error('Pojazd nie jest dostępny');
    }

    // Aktualizuj pojazd
    vehicle.currentDriverId = driverId;
    vehicle.status = 'w użyciu';
    
    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    // Dodaj log do historii
    const log = this.vehicleLogRepository.create({
      vehicleId: vehicle.id,
      driverId: driverId,
      eventType: 'rozpoczęcie_pracy',
      eventTime: new Date(),
      description: `Kierowca przypisany do pojazdu`,
    });
    await this.vehicleLogRepository.save(log);

    return this.findOne(vehicleId); // ← zwraca z kierowcą
  }

  // 🔥 ZWOLNIJ KIEROWCĘ
  async releaseDriver(vehicleId: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
    }

    const driverId = vehicle.currentDriverId;

    // Aktualizuj pojazd
    vehicle.currentDriverId = null;
    vehicle.status = 'dostępny';
    
    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    // Dodaj log do historii
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

  // 🔥 ZGŁOŚ AWARIĘ
  async reportBreakdown(vehicleId: number, description: string, photoUrl?: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
    }

    // Aktualizuj pojazd
    vehicle.isBreakdown = true;
    vehicle.status = 'niedostępny';
    
    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    // Dodaj log do historii
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
}