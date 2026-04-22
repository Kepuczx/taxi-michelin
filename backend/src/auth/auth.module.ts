import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity'; // <-- Twoja encja
import { DriverLog } from '../users/driver-log.entity';

@Module({
  imports: [
    // Dajemy temu modułowi dostęp do tabeli użytkowników w bazie
    TypeOrmModule.forFeature([User, DriverLog]), 
    
    // Konfigurujemy maszynę do drukowania biletów (tokenów JWT)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Ściąga hasło z pliku .env
        signOptions: { expiresIn: '1d' }, // Ważność tokena
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}