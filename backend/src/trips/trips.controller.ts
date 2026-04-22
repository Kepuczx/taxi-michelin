import { Controller, Post, Get, Body, Param, Patch, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import type { Request } from 'express';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  @Post('request')
  async requestTrip(@Body() data: any) {
    return this.tripsService.requestTrip(data.clientId, data);
  }

  @Get('client/:clientId')
  async getClientHistory(@Param('clientId') clientId: string) {
    return this.tripsService.getClientHistory(+clientId);
  }

  @Patch(':id/accept')
  async acceptTrip(@Param('id') id: string, @Body('driverId') driverId: number) {
    return this.tripsService.acceptTrip(+id, driverId);
  }

  // 🔥 ZMIENIONE: pobieranie przypisanych kursów (assigned)
  @Get('driver/:driverId/assigned')
  async getDriverAssignedTrips(@Param('driverId') driverId: string) {
    return this.tripsService.getDriverAssignedTrips(+driverId);
  }

  // 🔥 GŁÓWNY ENDPOINT - sprawdzanie aktywnego kursu
  @Get('driver/:driverId/active')
  async getDriverActiveTrip(@Param('driverId') driverId: string) {
    return this.tripsService.getDriverActiveTrip(+driverId);
  }

  @Patch(':id/start')
  async startTrip(
    @Param('id') id: string, 
    @Body('driverId') driverId: number,
    @Req() req: Request
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.tripsService.startTrip(+id, driverId, ipAddress, userAgent);
  }

  @Patch(':id/complete')
  async completeTrip(
    @Param('id') id: string, 
    @Body('driverId') driverId: number,
    @Req() req: Request
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.tripsService.completeTrip(+id, driverId, ipAddress, userAgent);
  }

  @Get('pending')
  async getPendingTrips() {
    return this.tripsService.getPendingTrips();
  }

  @Get('client/:clientId/active')
  async getClientActiveTrip(@Param('clientId') clientId: string) {
    return this.tripsService.getClientActiveTrip(+clientId);
  }

  @Patch(':id/cancel')
  async cancelTrip(
    @Param('id') id: string, 
    @Body('reason') reason: string,
    @Body('userId') userId: number
  ) {
    return this.tripsService.cancelTrip(+id, userId, reason);
  }

  // TEST ENDPOINT - wszystkie kursy
  @Get('all')
  async getAllTrips() {
    return this.tripsService.getAllTrips();
  }
}