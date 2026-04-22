import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id as any);
  }

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() body: any,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id as any);
  }

  // ========== NOWE ENDPOINTY DLA LOGÓW KIEROWCÓW ==========
  
  @Get(':id/logs')
  getDriverLogs(@Param('id') id: string) {
    return this.usersService.getDriverLogs(parseInt(id));
  }

  @Get('logs/all')
  getAllDriverLogs() {
    return this.usersService.getAllDriverLogs();
  }

  @Patch(':id/status')
  updateDriverStatus(
    @Param('id') id: string,
    @Body() body: { isOnline: boolean; lat?: number; lng?: number },
    @Req() req: Request
  ) {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.usersService.updateDriverStatus(
      parseInt(id),
      body.isOnline,
      body.lat,
      body.lng,
      changedBy,
      ipAddress,
      userAgent
    );
  }

  @Patch(':id/location')
  updateDriverLocation(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number; address?: string }
  ) {
    return this.usersService.updateDriverLocation(
      parseInt(id),
      body.lat,
      body.lng,
      body.address
    );
  }
}