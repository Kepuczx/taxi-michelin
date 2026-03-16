import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  carModel: string;

  @Column({ default: true })
  isActive: boolean;
}
