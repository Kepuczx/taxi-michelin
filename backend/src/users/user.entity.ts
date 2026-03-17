import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users') // nazwa tabeli w bazie
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string; // login

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 255, nullable: true }) // na razie hasło, potem LDAP
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

  @Column({ default: true })
  isActive: boolean;

  // Pole pomocnicze dla przyszłego LDAP
  @Column({ length: 255, nullable: true })
  ldapDn: string;

  // Automatyczne daty
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}