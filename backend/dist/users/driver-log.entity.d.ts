import { User } from './user.entity';
export declare class DriverLog {
    id: number;
    driver: User;
    driverId: number;
    eventType: string;
    eventTime: Date;
    locationLat: number;
    locationLng: number;
    locationAddress: string;
    description: string;
    relatedEntityType: string;
    relatedEntityId: number;
    changedBy: string;
    oldValues: any;
    newValues: any;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
