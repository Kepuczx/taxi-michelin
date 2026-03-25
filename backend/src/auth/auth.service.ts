import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Upewnij się, że ścieżka do Twojego pliku user.entity.ts jest poprawna!
import { User } from '../users/user.entity'; 

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}

  async login(loginDto: any) {
    // 1. Szukamy w bazie użytkownika po wpisanym emailu
    const user = await this.userRepository.findOne({ 
      where: { email: loginDto.email } 
    });

    // 2. Sprawdzamy czy użytkownik istnieje, czy MA hasło (bo nullable: true) 
    // i czy to hasło (ZWYKŁY TEKST) jest równe temu z formularza
    if (user && user.password && user.password === loginDto.password) {
      
      // 3. Sukces! Generujemy bilet. Dobrą praktyką jest dodanie 'sub' (subject) jako ID.
      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        role: user.role,
        message: `Witaj ${user.firstName}! Zalogowano pomyślnie jako ${user.role}.`,
      };
    }
    // 4. Błędne dane logowania
    throw new UnauthorizedException('Nieprawidłowy email lub hasło');
  }
}