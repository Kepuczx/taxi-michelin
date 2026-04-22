import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { User } from './user.entity';

@Entity('driver_logs')
export class DriverLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'driver_id' })
  driverId: number;

  @Column({
    type: 'enum',
    enum: [
      'logowanie', 
      'wylogowanie', 
      'zmiana_statusu', 
      'przypisanie_pojazdu', 
      'odpiecie_pojazdu', 
      'rozpoczęcie_kursu', 
      'zakonczenie_kursu', 
      'aktualizacja_lokalizacji', 
      'edycja_profilu', 
      'zmiana_hasla',
      'blokada_konta',
      'odblokowanie_konta'
    ]
  })
  eventType: string;

  @Column({ name: 'event_time' })
  eventTime: Date;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLat: number;

  @Column({ name: 'location_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLng: number;

  @Column({ name: 'location_address', nullable: true, length: 255 })
  locationAddress: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'related_entity_type', nullable: true, length: 50 })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: number;

  @Column({ name: 'changed_by', nullable: true, length: 100 })
  changedBy: string;

  @Column({ name: 'old_values', type: 'json', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'json', nullable: true })
  newValues: any;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, length: 255 })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}