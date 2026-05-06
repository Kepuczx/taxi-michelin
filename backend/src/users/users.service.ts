import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DriverLog } from './driver-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DriverLog)
    private driverLogRepository: Repository<DriverLog>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    // Sprawdź czy email już istnieje
    const existingUser = await this.usersRepository.findOneBy({ 
      email: userData.email 
    });
    if (existingUser) {
      throw new Error('Użytkownik z tym emailem już istnieje');
    }

    const newUser = this.usersRepository.create(userData);
    const savedUser = await this.usersRepository.save(newUser);
    
    // LOG: Tylko dla kierowców
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

  async update(id: any, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Użytkownik o id ${id} nie istnieje`);
    }
  }

  // ========== METODY DLA LOGÓW KIEROWCÓW ==========
  
  async getDriverLogs(driverId: number): Promise<DriverLog[]> {
    return this.driverLogRepository.find({
      where: { driverId },
      order: { eventTime: 'DESC' }
    });
  }

  async getAllDriverLogs(): Promise<DriverLog[]> {
    return this.driverLogRepository.find({
      relations: ['driver'],
      order: { eventTime: 'DESC' }
    });
  }

  async updateDriverStatus(
  driverId: number, 
  isOnline: boolean, 
  lat?: number, 
  lng?: number,
  changedBy?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<User> {
  console.log(`📡 updateDriverStatus: driverId=${driverId}, isOnline=${isOnline}`);
  
  const driver = await this.findOne(driverId);
  
  if (driver.role !== 'driver') {
    throw new BadRequestException('Tylko kierowcy mogą zmieniać status online/offline');
  }
  
  const oldStatus = driver.isOnline;
  
  // WYKONAJ UPDATE
  await this.usersRepository.update(driverId, { 
    isOnline: isOnline,
    ...(lat !== undefined && lng !== undefined ? { currentLat: lat, currentLng: lng } : {})
  });
  
  // Sprawdź czy zadziałało
  const updatedDriver = await this.findOne(driverId);
  console.log(`✅ Status zaktualizowany: ${oldStatus} -> ${updatedDriver.isOnline}`);
  
  // LOG zmiany statusu
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
  
  async updateDriverLocation(
    driverId: number, 
    lat: number, 
    lng: number,
    address?: string
  ): Promise<User> {
    const driver = await this.findOne(driverId);
    
    if (driver.role !== 'driver') {
      throw new BadRequestException('Tylko kierowcy mogą aktualizować lokalizację');
    }
    
    await this.usersRepository.update(driverId, { currentLat: lat, currentLng: lng });
    
    return this.findOne(driverId);
  }
}