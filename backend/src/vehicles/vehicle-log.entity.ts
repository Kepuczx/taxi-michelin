import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { User } from '../users/user.entity';

export type LogEventType = 'rozpoczęcie_pracy' | 'zakończenie_pracy' | 'przejazd' | 'uwagi' | 'awaria';

@Entity('vehicle_logs')
export class VehicleLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehicle, vehicle => vehicle.logs)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'driver_id', nullable: true, type: 'int' })
  driverId: number | null;

  @Column({
    type: 'enum',
    enum: ['rozpoczęcie_pracy', 'zakończenie_pracy', 'przejazd', 'uwagi', 'awaria']
  })
  eventType: LogEventType;

  @Column({ name: 'event_time' })
  eventTime: Date;

  @Column({ name: 'passengers_count', nullable: true, type: 'int' })
  passengersCount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'photo_url', nullable: true, length: 500 })
  photoUrl: string;

  @Column({ name: 'start_location', nullable: true, length: 255 })
  startLocation: string;

  @Column({ name: 'end_location', nullable: true, length: 255 })
  endLocation: string;

  @Column({ name: 'distance_km', nullable: true, type: 'decimal', precision: 10, scale: 2 })
  distanceKm: number;

  // 🔥 NOWE POLE – kto wykonał zmianę
  @Column({ name: 'changed_by', nullable: true, length: 100 })
  changedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}