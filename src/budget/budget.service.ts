import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../database/entities/Budget.entity';
import { BudgetRequest } from '../database/entities/BudgetRequest.entity';
import { Like } from 'typeorm'; // Import Like from typeorm

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetRequest)
    private requestRepo: Repository<BudgetRequest>,
  ) {}

  // ========== BUDGET MANAGEMENT ==========
  async getAllBudgets() {
    return await this.budgetRepo.find({
      where: { is_active: true },
      order: { tahun: 'DESC', department: 'ASC' }
    });
  }

  async createBudget(data: any) {
    const budget = this.budgetRepo.create({
      ...data,
      sisa_budget: data.total_budget 
    });
    return await this.budgetRepo.save(budget);
  }

  async updateBudget(id: number, data: any) {
    await this.budgetRepo.update(id, data);
    return await this.budgetRepo.findOne({ where: { id } });
  }

  async deleteBudget(id: number) {
    // Soft delete
    await this.budgetRepo.update(id, { is_active: false });
    return { message: 'Budget deleted' };
  }

  // ========== REQUEST MANAGEMENT ==========
  async getAllRequests() {
    return await this.requestRepo.find({
      relations: ['budget'],
      order: { created_at: 'DESC' }
    });
  }

  async createRequest(data: any) {
    // Generate no_request: REQ/2024/02/001
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
      relations: ['budget']
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