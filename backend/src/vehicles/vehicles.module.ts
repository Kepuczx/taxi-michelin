import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { VehicleLog } from './vehicle-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleLog])], // User nie musi być tutaj!
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}