import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { VehicleLog } from './vehicle-log.entity';
import { User } from '../users/user.entity';  // ← DODANY IMPORT

export type VehicleStatus = 'dostępny' | 'w użyciu' | 'niedostępny';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  registration: string; // rejestracja

  @Column({ length: 50 })
  brand: string; // marka

  @Column({ length: 50 })
  model: string; // model

  @Column({ name: 'passenger_capacity' })
  passengerCapacity: number; // ile miejsc dla pasażerów

  @Column({
    type: 'enum',
    enum: ['dostępny', 'w użyciu', 'niedostępny'],
    default: 'dostępny'
  })
  status: VehicleStatus;

  @Column({ name: 'current_driver_id', nullable: true, type: 'int' })  // ← DODAJ type: 'int'
currentDriverId: number | null;  // ← ZMIEŃ TYP na number | null

  // 🔥 DODANA RELACJA One-to-One z User
  @OneToOne(() => User)
  @JoinColumn({ name: 'current_driver_id' })
  currentDriver: User;

  @Column({ name: 'is_breakdown', default: false })
  isBreakdown: boolean; // czy awaria?

  @Column({ type: 'text', nullable: true })
  notes: string; // uwagi ogólne

  // Relacja: jeden pojazd ma wiele logów
  @OneToMany(() => VehicleLog, log => log.vehicle)
  logs: VehicleLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}