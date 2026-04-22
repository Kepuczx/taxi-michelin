import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { DriverLog } from '../users/driver-log.entity';
export declare class AuthService {
    private userRepository;
    private driverLogRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, driverLogRepository: Repository<DriverLog>, jwtService: JwtService);
    login(loginDto: any, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        role: string;
        user: {
            id: number;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        message: string;
    }>;
    logout(userId: number, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
    }>;
}
