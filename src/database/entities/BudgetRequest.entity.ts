import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Budget } from './Budget.entity';

@Entity('budget_requests')
export class BudgetRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  request_no!: string;

  @Column({ type: 'varchar', length: 100 })
  requester_name!: string;

  @Column({ type: 'varchar', length: 50 })
  requester_badge!: string;

  @Column({ type: 'varchar', length: 100 })
  department!: string;

  @Column({ type: 'enum', enum: ['ITEM', 'SERVICE'] })
  request_type!: string;

  @Column({ type: 'varchar', length: 255 })
  item_name!: string;

  @Column({ type: 'text' })
  specification!: string;

  @Column({ type: 'int' })
  quantity!: number;

  // ===== MULTI-CURRENCY FIELDS =====
  @Column({ type: 'varchar', length: 10, default: 'IDR' })
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  exchange_rate!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  estimated_unit_price!: number; // Dalam currency yang dipilih

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimated_unit_price_idr!: number; // Dalam IDR

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  estimated_total!: number; // Dalam currency yang dipilih

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimated_total_idr!: number; // Dalam IDR

  @Column({ type: 'enum', enum: ['CAPEX', 'OPEX'] })
  budget_type!: string;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column()
  budget_id!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reserved_amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reserved_amount_idr!: number;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at!: Date;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'SUBMITTED', 'BUDGET_APPROVED', 'BUDGET_REJECTED', 'WAITING_SR_MR'],
    default: 'DRAFT'
  })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}