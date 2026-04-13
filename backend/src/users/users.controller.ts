import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch, // Dodano brakujący import
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    // Jeśli id to UUID (Supabase), nie używaj +id (konwersji na liczbę)
    return this.usersService.findOne(id as any);
  }

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  // ZOSTAWIAMY TYLKO JEDNĄ METODĘ UPDATE
  // Używamy @Patch, bo edytujemy tylko wybrane pola (email/hasło)
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() body: any,
  ) {
    // Wywołujemy funkcję w serwisie - upewnij się, że w users.service.ts 
    // funkcja nazywa się update(id, userData)
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    // Usunięto +id, aby obsługiwać UUID jako string
    return this.usersService.remove(id as any);
  }
}