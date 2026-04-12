/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
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
    return this.usersService.findOne(+id);
  }

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(+id, userData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }

  // --- TA METODA OBSŁUGUJE EDYCJĘ Z MODALA ---
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { email?: string; password?: string },
  ) {
    // Uwaga: id przekazujemy jako string, bo Supabase Auth używa UUID (ciąg znaków)
    console.log('Backend: Próba aktualizacji użytkownika o ID:', id);
    return this.usersService.updateUser(id, body);
  }
}
