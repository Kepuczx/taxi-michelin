import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';

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
  create(@Body() vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    return this.vehiclesService.create(vehicleData);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() vehicleData: Partial<Vehicle>
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, vehicleData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vehiclesService.remove(id);
  }

  // 🔥 NOWE ENDPOINTY

  @Patch(':id/assign-driver/:driverId')
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<Vehicle> {
    return this.vehiclesService.assignDriver(id, driverId);
  }

  @Patch(':id/release-driver')
  releaseDriver(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Vehicle> {
    return this.vehiclesService.releaseDriver(id);
  }

  @Post(':id/report-breakdown')
  reportBreakdown(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { description: string; photoUrl?: string }
  ): Promise<Vehicle> {
    return this.vehiclesService.reportBreakdown(id, body.description, body.photoUrl);
  }
}