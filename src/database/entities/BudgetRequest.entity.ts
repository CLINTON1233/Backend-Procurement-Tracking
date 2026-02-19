import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Budget } from './Budget.entity';

@Entity('budget_requests')
export class BudgetRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  no_request!: string; 

  @Column({ type: 'varchar', length: 100 })
  requester_name!: string;

  @Column({ type: 'varchar', length: 50 })
  requester_badge!: string;

  @Column({ type: 'varchar', length: 50 })
  department!: string;

  @Column({ type: 'enum', enum: ['BARANG', 'JASA'] })
  tipe_permintaan!: string;

  @Column({ type: 'varchar', length: 255 })
  nama_item!: string;

  @Column({ type: 'text' })
  spesifikasi!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  estimasi_harga!: number;

  @Column({ type: 'enum', enum: ['CAPEX', 'OPEX'] })
  jenis_budget!: string;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column({ type: 'int' })
  budget_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lampiran: string | null = null;

  @Column({ 
    type: 'enum', 
    enum: ['DRAFT', 'SUBMITTED', 'BUDGET_APPROVED', 'BUDGET_REJECTED', 'WAITING_SR_MR', 'COMPLETED'],
    default: 'DRAFT'
  })
  status: string = 'DRAFT';

  @Column({ type: 'text', nullable: true })
  catatan: string | null = null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}