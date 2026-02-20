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
      order: { tahun: 'DESC', department_name: 'ASC' }
    });
  }

async createBudget(data: any) {
  try {
    if (!data.department_name) {
      throw new Error('Department name is required');
    }

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

    const budget = this.budgetRepo.create({
      tahun: data.tahun,
      department_name: data.department_name,
      jenis: data.jenis,
      nama_budget: data.nama_budget,
      total_budget: data.total_budget,
      sisa_budget: data.total_budget,
      keterangan: data.keterangan || null,
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
      
      if (data.nama_budget) updateData.nama_budget = data.nama_budget;
      if (data.jenis) updateData.jenis = data.jenis;
      if (data.department_name) updateData.department_name = data.department_name;
      if (data.tahun) updateData.tahun = data.tahun;
      if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
      
      // LOGIC RESET: Jika total budget diubah, maka remaining budget = total budget baru
      if (data.total_budget && Number(data.total_budget) !== Number(existingBudget.total_budget)) {
        updateData.total_budget = data.total_budget;
        updateData.sisa_budget = data.total_budget;
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

    // Jika tidak ada request, hard delete
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
      where: { no_request: Like(`REQ/${year}/${month}/%`) },
      order: { id: 'DESC' }
    });
    
    let sequence = '001';
    if (lastRequest) {
      const lastSeq = parseInt(lastRequest.no_request.split('/').pop() || '0');
      sequence = String(lastSeq + 1).padStart(3, '0');
    }
    
    const no_request = `REQ/${year}/${month}/${sequence}`;
    
    const request = this.requestRepo.create({
      ...data,
      no_request,
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
    
    if (budget.sisa_budget >= request.estimasi_harga) {
      request.status = 'BUDGET_APPROVED';
      budget.sisa_budget = Number(budget.sisa_budget) - Number(request.estimasi_harga);
      await this.budgetRepo.save(budget);
    } else {
      request.status = 'BUDGET_REJECTED';
      request.catatan = `Budget tidak cukup. Sisa: Rp ${budget.sisa_budget.toLocaleString()}`;
    }
    
    return await this.requestRepo.save(request);
  }

  async chooseSRMR(id: number, tipe: 'SR' | 'MR') {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new Error('Request not found');
    
    request.status = 'WAITING_SR_MR';
    request.tipe_permintaan = tipe === 'SR' ? 'JASA' : 'BARANG';
    
    return await this.requestRepo.save(request);
  }

  async getDashboardStats() {
    const totalBudget = await this.budgetRepo
      .createQueryBuilder('budget')
      .select('SUM(budget.total_budget)', 'total')
      .getRawOne();
      
    const totalSisa = await this.budgetRepo
      .createQueryBuilder('budget')
      .select('SUM(budget.sisa_budget)', 'total')
      .getRawOne();
      
    const pendingRequests = await this.requestRepo.count({
      where: { status: 'SUBMITTED' }
    });
    
    const approvedRequests = await this.requestRepo.count({
      where: { status: 'BUDGET_APPROVED' }
    });
    
    return {
      total_budget: totalBudget.total || 0,
      total_sisa: totalSisa.total || 0,
      pending_requests: pendingRequests,
      approved_requests: approvedRequests,
      budget_used: (totalBudget.total || 0) - (totalSisa.total || 0)
    };
  }
}