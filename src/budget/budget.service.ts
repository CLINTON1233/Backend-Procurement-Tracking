import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../database/entities/Budget.entity';
import { BudgetRequest } from '../database/entities/BudgetRequest.entity';
import { Department } from '../database/entities/Department.entity';
import { Like } from 'typeorm';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetRequest)
    private requestRepo: Repository<BudgetRequest>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  // ========== BUDGET MANAGEMENT ==========
  async getAllBudgets() {
    return await this.budgetRepo.find({
      where: { is_active: true },
      relations: ['department_rel'],
      order: { fiscal_year: 'DESC', department_name: 'ASC' }
    });
  }

  async createBudget(data: any) {
    try {
      if (!data.department_name) {
        throw new Error('Department name is required');
      }

      // Check if department exists
      const department = await this.departmentRepo.findOne({ 
        where: { name: data.department_name } 
      });
      
      if (!department) {
        const newDept = await this.departmentRepo.save({
          name: data.department_name,
          is_active: true
        });
        console.log(`✅ Department ${data.department_name} created automatically`);
      }

      // ✅ PERBAIKAN: Gunakan field yang benar dari frontend
      const totalAmount = Number(data.total_amount) || 0;
      const remainingAmount = totalAmount; // Awalnya sama dengan total
      const usedAmount = 0; // Awalnya 0
      const reservedAmount = Number(data.reserved_amount) || 0;
      
      const periodStart = data.period_start || null;
      const periodEnd = data.period_end || null;
      const budgetOwner = data.budget_owner || null;
      const budgetCode = data.budget_code || null;
      const revisionNo = data.revision_no || 0;
      const lastRevisionAt = data.last_revision_at || null;

      const budget = this.budgetRepo.create({
        fiscal_year: data.fiscal_year,
        department_name: data.department_name,
        budget_type: data.budget_type,
        budget_name: data.budget_name,
        budget_code: budgetCode,
        description: data.description || null,
        total_amount: totalAmount,
        remaining_amount: remainingAmount,
        used_amount: usedAmount,
        reserved_amount: reservedAmount,
        period_start: periodStart,
        period_end: periodEnd,
        budget_owner: budgetOwner,
        revision_no: revisionNo,
        last_revision_at: lastRevisionAt,
        is_active: true
      });
      
      return await this.budgetRepo.save(budget);
    } catch (error) {
      console.error('Error creating budget:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create budget: ${error.message}`);
      }
      throw new Error('Failed to create budget');
    }
  }

  async updateBudget(id: number, data: any) {
    try {
      const existingBudget = await this.budgetRepo.findOne({ 
        where: { id } 
      });
      
      if (!existingBudget) {
        throw new Error('Budget not found');
      }
      
      const updateData: Partial<Budget> = {};
      
      // Basic fields
      if (data.budget_name) updateData.budget_name = data.budget_name;
      if (data.budget_type) updateData.budget_type = data.budget_type;
      if (data.department_name) updateData.department_name = data.department_name;
      if (data.fiscal_year) updateData.fiscal_year = data.fiscal_year;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.budget_code !== undefined) updateData.budget_code = data.budget_code;
      if (data.budget_owner !== undefined) updateData.budget_owner = data.budget_owner;
      if (data.period_start !== undefined) updateData.period_start = data.period_start;
      if (data.period_end !== undefined) updateData.period_end = data.period_end;
      
      // Financial fields
      if (data.reserved_amount !== undefined) updateData.reserved_amount = data.reserved_amount;
      
      // Jika total amount diubah, hitung ulang remaining_amount
      if (data.total_amount && Number(data.total_amount) !== Number(existingBudget.total_amount)) {
        updateData.total_amount = data.total_amount;
        updateData.remaining_amount = Number(data.total_amount) - Number(existingBudget.used_amount);
      }

      await this.budgetRepo.update(id, updateData);
      
      const updatedBudget = await this.budgetRepo.findOne({ 
        where: { id },
        relations: ['department_rel']
      });
      
      return updatedBudget;
    } catch (error) {
      console.error('Error updating budget:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update budget: ${error.message}`);
      }
      throw new Error('Failed to update budget');
    }
  }

  async deleteBudget(id: number) {
    try {
      const hasRequests = await this.requestRepo.count({
        where: { budget_id: id }
      });

      if (hasRequests > 0) {
        await this.budgetRepo.update(id, { is_active: false });
        return { 
          message: 'Budget has related requests, set to inactive instead', 
          softDelete: true 
        };
      }

      const result = await this.budgetRepo.delete(id);
      
      if (result.affected === 0) {
        throw new Error('Budget not found');
      }

      return { message: 'Budget permanently deleted', hardDelete: true };
    } catch (error) {
      console.error('Error deleting budget:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete budget: ${error.message}`);
      }
      throw new Error('Failed to delete budget');
    }
  }

  // ========== REQUEST MANAGEMENT ==========
  async getAllRequests() {
    return await this.requestRepo.find({
      relations: ['budget', 'department_rel'],
      order: { created_at: 'DESC' }
    });
  }

  async createRequest(data: any) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastRequest = await this.requestRepo.findOne({
      where: { request_no: Like(`REQ/${year}/${month}/%`) },
      order: { id: 'DESC' }
    });
    
    let sequence = '001';
    if (lastRequest) {
      const lastSeq = parseInt(lastRequest.request_no.split('/').pop() || '0');
      sequence = String(lastSeq + 1).padStart(3, '0');
    }
    
    const request_no = `REQ/${year}/${month}/${sequence}`;
    
    const request = this.requestRepo.create({
      ...data,
      request_no,
      status: 'DRAFT'
    });
    
    return await this.requestRepo.save(request);
  }

  async submitRequest(id: number) {
    const request = await this.requestRepo.findOne({ 
      where: { id },
      relations: ['budget', 'department_rel']
    });
    
    if (!request) throw new Error('Request not found');
    
    const budget = await this.budgetRepo.findOne({ 
      where: { id: request.budget_id } 
    });
    
    if (!budget) throw new Error('Budget not found'); 
    
    if (budget.remaining_amount >= request.estimated_total) {
      // Update budget
      budget.remaining_amount = Number(budget.remaining_amount) - Number(request.estimated_total);
      budget.used_amount = Number(budget.used_amount) + Number(request.estimated_total);
      await this.budgetRepo.save(budget);
      
      // Update request
      request.status = 'BUDGET_APPROVED';
      request.submitted_at = new Date();
    } else {
      request.status = 'BUDGET_REJECTED';
      request.notes = `Insufficient budget. Remaining: Rp ${budget.remaining_amount.toLocaleString()}`;
    }
    
    return await this.requestRepo.save(request);
  }

  async chooseSRMR(id: number, tipe: 'SR' | 'MR') {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new Error('Request not found');
    
    request.status = 'WAITING_SR_MR';
    request.request_type = tipe === 'SR' ? 'SERVICE' : 'ITEM';
    
    return await this.requestRepo.save(request);
  }

  async getDashboardStats() {
    const totalBudget = await this.budgetRepo
      .createQueryBuilder('budget')
      .select('SUM(budget.total_amount)', 'total')
      .getRawOne();
      
    const totalRemaining = await this.budgetRepo
      .createQueryBuilder('budget')
      .select('SUM(budget.remaining_amount)', 'total')
      .getRawOne();
      
    const pendingRequests = await this.requestRepo.count({
      where: { status: 'SUBMITTED' }
    });
    
    const approvedRequests = await this.requestRepo.count({
      where: { status: 'BUDGET_APPROVED' }
    });
    
    return {
      total_budget: totalBudget.total || 0,
      total_remaining: totalRemaining.total || 0,
      pending_requests: pendingRequests,
      approved_requests: approvedRequests,
      budget_used: (totalBudget.total || 0) - (totalRemaining.total || 0)
    };
  }
}