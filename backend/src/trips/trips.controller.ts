import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')

export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  // 🔥 PRACOWNIK: Zamawianie nowego kursu
  // POST http://TWOJE_IP:3000/trips/request
  @Post('request')
  async requestTrip(@Body() data: any) {
    // W przyszłości clientId wyciągniemy z tokena JWT,
    // na razie oczekujemy go w obiekcie wysłanym z telefonu
    return this.tripsService.requestTrip(data.clientId, data);
  }

  // 🔥 PRACOWNIK: Pobieranie historii swoich kursów
  // GET http://TWOJE_IP:3000/trips/client/1
  @Get('client/:clientId')
  async getClientHistory(@Param('clientId') clientId: string) {
    return this.tripsService.getClientHistory(+clientId);
  }

  // 🚕 KIEROWCA: Akceptacja kursu
  // Patch http://TWOJE_IP:3000/trips/5/accept
  @Patch(':id/accept')
async acceptTrip(@Param('id') id: string, @Body('driverId') driverId: number) {
  return this.tripsService.acceptTrip(+id, driverId); //
} 

  // 🚕 KIEROWCA: Pobieranie listy swoich aktywnych przypisań
  // GET http://TWOJE_IP:3000/trips/driver/2/active
  @Get('driver/:driverId/active')
  async getDriverActiveTrips(@Param('driverId') driverId: string) {
    return this.tripsService.getDriverActiveTrips(+driverId);
  }
  @Patch(':id/start')
  async startTrip(@Param('id') id: string, @Body('driverId') driverId: number) {
  return this.tripsService.startTrip(+id, driverId); // Wywołuje logikę rozpoczęcia kursu
  }

  @Patch(':id/complete')
  async completeTrip(@Param('id') id: string, @Body('driverId') driverId: number) {
    return this.tripsService.completeTrip(+id, driverId); // Wywołuje logikę zakończenia kursu
  }

  @Get('pending')
  async getPendingTrips() {
    return this.tripsService.getPendingTrips();
  }
}
