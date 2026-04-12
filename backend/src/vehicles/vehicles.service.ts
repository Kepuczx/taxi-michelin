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

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['currentDriver'],
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['currentDriver', 'logs'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Pojazd o id ${id} nie istnieje`);
    }
    return vehicle;
  }

  // ==================== LOGI ====================
  
  async getLogsByVehicle(vehicleId: number): Promise<VehicleLog[]> {
    return this.vehicleLogRepository.find({
      where: { vehicleId },
      relations: ['driver'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAllLogs(): Promise<VehicleLog[]> {
    return this.vehicleLogRepository.find({
      relations: ['vehicle', 'driver'],
      order: { createdAt: 'DESC' }
    });
  }

  // ==================== CRUD ====================

  async create(vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle> {
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

  async update(id: number, vehicleData: Partial<Vehicle>, changedBy?: string): Promise<Vehicle> {
    const oldVehicle = await this.findOne(id);
    await this.vehicleRepository.update(id, vehicleData);
    const updatedVehicle = await this.findOne(id);
    
    const changes: string[] = [];
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
    // 🔥 DODANE: porównanie awarii
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

  async remove(id: number): Promise<void> {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pojazd o id ${id} nie istnieje`);
    }
  }

  // ==================== AWARIE ====================

  async toggleBreakdown(id: number, isBreakdown: boolean, changedBy?: string): Promise<Vehicle> {
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

  async reportBreakdown(vehicleId: number, description: string, changedBy?: string, photoUrl?: string): Promise<Vehicle> {
    const vehicle = await this.findOne(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
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

  // ==================== KIEROWCY ====================

  async assignDriver(vehicleId: number, driverId: number, changedBy?: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
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
      changedBy: changedBy || 'system',
    });
    await this.vehicleLogRepository.save(log);

    return this.findOne(vehicleId);
  }

  async releaseDriver(vehicleId: number, changedBy?: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Pojazd nie istnieje');
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
        changedBy: changedBy || 'system',
      });
      await this.vehicleLogRepository.save(log);
    }

    return this.findOne(vehicleId);
  }
}