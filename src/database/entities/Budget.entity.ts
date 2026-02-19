import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  tahun!: string;

  @Column({ type: 'varchar', length: 50 })
  department!: string;

  @Column({ type: 'enum', enum: ['CAPEX', 'OPEX'] })
  jenis!: string;

  @Column({ type: 'varchar', length: 255 })
  nama_budget!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_budget!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sisa_budget: number = 0;

  @Column({ type: 'text', nullable: true })
  keterangan: string | null = null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean = true;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}