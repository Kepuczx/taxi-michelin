import { UsersService } from './users.service';
import { User } from './user.entity';
import type { Request } from 'express';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(userData: Partial<User>): Promise<User>;
    update(id: string, body: any): Promise<User>;
    remove(id: string): Promise<void>;
    getDriverLogs(id: string): Promise<import("./driver-log.entity").DriverLog[]>;
    getAllDriverLogs(): Promise<import("./driver-log.entity").DriverLog[]>;
    updateDriverStatus(id: string, body: {
        isOnline: boolean;
        lat?: number;
        lng?: number;
    }, req: Request): Promise<User>;
    updateDriverLocation(id: string, body: {
        lat: number;
        lng: number;
        address?: string;
    }): Promise<User>;
}
