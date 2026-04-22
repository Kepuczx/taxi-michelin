import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Ten dekorator tworzy adres URL: http://localhost:3000/auth/login
  @Post('login')
  login(@Body() loginDto: any, @Req() req: Request) {
    // Przekazujemy email i hasło do "kuchni" (do auth.service.ts)
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  logout(@Body() body: { userId: number }, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.logout(body.userId, ipAddress, userAgent);
  }
}