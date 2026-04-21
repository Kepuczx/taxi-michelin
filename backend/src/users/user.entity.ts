import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';  // ← POPRAWIONA ŚCIEŻKA

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 255, nullable: true })
  password: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'driver', 'employee'],
    default: 'employee'
  })
  role: string;

  @Column({ type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true })
  currentLat: number;

  @Column({ type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true })
  currentLng: number;

  @Column({ default: false })
  isOnline: boolean;


  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 255, nullable: true })
  ldapDn: string;

  @OneToOne(() => Vehicle, vehicle => vehicle.currentDriver)
  currentVehicle: Vehicle;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}