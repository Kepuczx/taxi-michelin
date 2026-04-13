import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Trip } from './trips.entity';
import { TripsGateway } from './trips.gateway'; // 🔥 NOWE

@Module({
  imports: [TypeOrmModule.forFeature([Trip])],
  controllers: [TripsController],
  providers: [TripsService, TripsGateway],
  exports: [TripsService],
})
export class TripsModule {}
