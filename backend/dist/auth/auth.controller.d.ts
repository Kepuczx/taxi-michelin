import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: any): Promise<{
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
}
