import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Department } from './Department.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  fiscal_year!: string;

  @Column({ type: 'varchar', length: 100 })
  department_name!: string;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_name', referencedColumnName: 'name' })
  department_rel!: Department;

  @Column({ type: 'enum', enum: ['CAPEX', 'OPEX'] })
  budget_type!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  budget_code!: string;

  @Column({ type: 'varchar', length: 255 })
  budget_name!: string;

  // ===== MULTI-CURRENCY FIELDS =====
  @Column({ type: 'varchar', length: 10, default: 'IDR' })
  currency!: string; // IDR, USD, EUR, SGD, etc.

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  exchange_rate!: number; // Kurs ke IDR (jika bukan IDR)

  @Column({ type: 'varchar', length: 10, nullable: true })
  convert_to!: string; // Mata uang tujuan konversi

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  exchange_rate_input!: number; // Kurs yang diinput user

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  converted_amount!: number; // Hasil konversi

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount!: number; // Dalam currency yang dipilih

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_amount_idr!: number; // Dalam IDR (untuk perhitungan)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reserved_amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reserved_amount_idr!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  used_amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  used_amount_idr!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  remaining_amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  remaining_amount_idr!: number;

  @Column({ type: 'date', nullable: true })
  period_start!: Date;

  @Column({ type: 'date', nullable: true })
  period_end!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  budget_owner!: string;

  @Column({ type: 'int', default: 0 })
  revision_no!: number;

  @Column({ type: 'timestamp', nullable: true })
  last_revision_at!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
