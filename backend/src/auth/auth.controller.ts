import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Ten dekorator tworzy adres URL: http://localhost:3000/auth/login
  @Post('login')
  login(@Body() loginDto: any) {
    // Przekazujemy email i hasło do "kuchni" (do auth.service.ts)
    return this.authService.login(loginDto);
  }
}
