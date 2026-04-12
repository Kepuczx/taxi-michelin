import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

export type TripStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;
  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;
  @Column({ name: 'driver_id', nullable: true })
  driverId: number;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;
  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'pickup_lat' })
  pickupLat: number;
  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'pickup_lng' })
  pickupLng: number;
  @Column({ name: 'pickup_address', nullable: true, type: 'text' })
  pickupAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'dropoff_lat', nullable: true })
  dropoffLat: number;
  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'dropoff_lng', nullable: true })
  dropoffLng: number;
  @Column({ name: 'dropoff_address', nullable: true, type: 'text' })
  dropoffAddress: string;

  @Column({ name: 'route_polyline', nullable: true, type: 'text' })
  routePolyline: string;
  @Column({ name: 'distance_km', nullable: true, type: 'decimal', precision: 10, scale: 2 })
  distanceKm: number;
  @Column({ name: 'duration_min', nullable: true, type: 'int' })
  durationMin: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: TripStatus;

  @Column({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;
  @Column({ name: 'assigned_at', nullable: true, type: 'timestamp' })
  assignedAt: Date;
  @Column({ name: 'started_at', nullable: true, type: 'timestamp' })
  startedAt: Date;
  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt: Date;
  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ name: 'passenger_count', default: 1 })
  passengerCount: number;
  @Column({ type: 'text', nullable: true })
  notes: string;
  @Column({ name: 'cancellation_reason', nullable: true, type: 'text' })
  cancellationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}