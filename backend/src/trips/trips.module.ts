import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripsGateway } from './trips.gateway';
import { Trip } from './trips.entity';
import { DriverLog } from '../users/driver-log.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, DriverLog, User])],
  controllers: [TripsController],
  providers: [TripsService, TripsGateway],
  exports: [TripsService],
})
export class TripsModule {}