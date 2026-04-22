import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DriverLog } from './driver-log.entity';
export declare class UsersService {
    private usersRepository;
    private driverLogRepository;
    constructor(usersRepository: Repository<User>, driverLogRepository: Repository<DriverLog>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(userData: Partial<User>): Promise<User>;
    update(id: any, userData: Partial<User>): Promise<User>;
    remove(id: number): Promise<void>;
    getDriverLogs(driverId: number): Promise<DriverLog[]>;
    getAllDriverLogs(): Promise<DriverLog[]>;
    updateDriverStatus(driverId: number, isOnline: boolean, lat?: number, lng?: number, changedBy?: string, ipAddress?: string, userAgent?: string): Promise<User>;
    updateDriverLocation(driverId: number, lat: number, lng: number, address?: string): Promise<User>;
}
