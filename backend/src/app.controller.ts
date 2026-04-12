/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // To jest Twój stary endpoint, z którym witał się HomePage (zostawiamy go)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // DODAJEMY NOWY ENDPOINT LOGOWANIA
  @Post('api/login')
  login(@Body() body: any) {
    const { username, password } = body;

    // Nasze "udawane" logowanie (mock)
    if (username === 'admin' && password === 'admin') {
      return {
        message: 'Zalogowano pomyślnie',
        token: 'fake-jwt-token-do-testow',
      };
    }

    // Jeśli hasło jest złe, NestJS automatycznie wyśle błąd 401 (Unauthorized)
    throw new UnauthorizedException({ error: 'Błędny login lub hasło' });
  }
}
