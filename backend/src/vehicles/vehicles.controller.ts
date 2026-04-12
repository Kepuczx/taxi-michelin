import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Req } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import type { Request } from 'express';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  create(
    @Body() vehicleData: Partial<Vehicle>,
    @Req() req: Request
  ): Promise<Vehicle> {
    // 🔥 ODczytaj nagłówek X-Changed-By (z localStorage frontendu)
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.create(vehicleData, changedBy);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() vehicleData: Partial<Vehicle>,
    @Req() req: Request
  ): Promise<Vehicle> {
    // 🔥 ODczytaj nagłówek X-Changed-By (z localStorage frontendu)
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.update(id, vehicleData, changedBy);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ): Promise<void> {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.remove(id);
  }

  // 🔥 ENDPOINTY DLA LOGÓW
  @Get('vehicle-logs/vehicle/:vehicleId')
  getLogsByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.vehiclesService.getLogsByVehicle(vehicleId);
  }

  @Get('vehicle-logs')
  getAllLogs() {
    return this.vehiclesService.getAllLogs();
  }

  // 🔥 ZMIANA STATUSU AWARII (z logiem)
  @Patch(':id/toggle-breakdown')
  toggleBreakdown(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isBreakdown: boolean },
    @Req() req: Request
  ) {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.toggleBreakdown(id, body.isBreakdown, changedBy);
  }

  // 🔥 PRZYPISZ KIEROWCĘ DO POJAZDU
  @Patch(':id/assign-driver/:driverId')
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Param('driverId', ParseIntPipe) driverId: number,
    @Req() req: Request
  ): Promise<Vehicle> {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.assignDriver(id, driverId, changedBy);
  }

  @Patch(':id/release-driver')
  releaseDriver(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ): Promise<Vehicle> {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.releaseDriver(id, changedBy);
  }

  @Post(':id/report-breakdown')
  reportBreakdown(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { description: string; photoUrl?: string },
    @Req() req: Request
  ): Promise<Vehicle> {
    const changedBy = req.headers['x-changed-by'] as string || 'system';
    return this.vehiclesService.reportBreakdown(id, body.description, changedBy, body.photoUrl);
  }
}