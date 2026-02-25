import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Budget } from './Budget.entity';
import { BudgetRequest } from './BudgetRequest.entity';

@Entity('budget_revisions')
export class BudgetRevision {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  request_id!: number;

  @ManyToOne(() => BudgetRequest)
  @JoinColumn({ name: 'request_id' })
  request!: BudgetRequest;

  @Column()
  budget_id!: number;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  original_amount!: number; // Amount sebelum revisi

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  new_amount!: number; // Amount setelah revisi

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  reduction_percentage!: number; 

  @Column({ type: 'varchar', length: 10, default: 'IDR' })
  currency!: string;

  @Column({ type: 'text' })
  reason!: string; // Alasan revisi

  @Column({ type: 'json', nullable: true })
  previous_data!: any; 

  @Column({ type: 'json', nullable: true })
  new_data!: any; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  revised_by!: string; // User yang melakukan revisi

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}