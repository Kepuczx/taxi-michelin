import { AuthService } from './auth.service';
import type { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: any, req: Request): Promise<{
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
    logout(body: {
        userId: number;
    }, req: Request): Promise<{
        message: string;
    }>;
}
