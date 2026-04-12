import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // 2. Sprawdzamy czy użytkownik istnieje, czy MA hasło i czy hasło jest poprawne
    if (user && user.password && user.password === loginDto.password) {
      
      // 3. Generujemy token
      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      // 🔥 ZWRACAMY PEŁNE DANE UŻYTKOWNIKA
      return {
        access_token: this.jwtService.sign(payload),
        role: user.role,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        message: `Witaj ${user.firstName}! Zalogowano pomyślnie jako ${user.role}.`,
      };
    }
    // 4. Błędne dane logowania
    throw new UnauthorizedException('Nieprawidłowy email lub hasło');
  }
}