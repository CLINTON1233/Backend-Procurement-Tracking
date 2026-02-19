import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Budget } from './Budget.entity';
import { BudgetRequest } from './BudgetRequest.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean = true;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relasi ke Budget
  @OneToMany(() => Budget, (budget) => budget.department_rel)
  budgets!: Budget[];

  // Relasi ke BudgetRequest
  @OneToMany(() => BudgetRequest, (request) => request.department_rel)
  budget_requests!: BudgetRequest[];
}