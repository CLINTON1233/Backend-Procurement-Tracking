import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../database/entities/Budget.entity';
import { BudgetRequest } from '../database/entities/BudgetRequest.entity';
import { Department } from '../database/entities/Department.entity';
import { Like } from 'typeorm';
import { BudgetRevision } from 'src/database/entities/BudgetRevision.entity';

const CURRENCY_RATES = {
  IDR: 1,
  USD: 15700, // 1 USD = 15,700 IDR
  EUR: 17000, // 1 EUR = 17,000 IDR
  SGD: 11600, // 1 SGD = 11,600 IDR
  GBP: 19800, // 1 GBP = 19,800 IDR
  JPY: 105, // 1 JPY = 105 IDR
  AUD: 10200, // 1 AUD = 10,200 IDR
  CNY: 2170, // 1 CNY = 2,170 IDR
  MYR: 3350, // 1 MYR = 3,350 IDR
  THB: 435, // 1 THB = 435 IDR
  KRW: 11.5, // 1 KRW = 11.5 IDR
  INR: 188, // 1 INR = 188 IDR
  SAR: 4180, // 1 SAR = 4,180 IDR
  AED: 4270, // 1 AED = 4,270 IDR
  HKD: 2000, // 1 HKD = 2,000 IDR
};

const getExchangeRate = (currency: string): number => {
  return CURRENCY_RATES[currency] || 1;
};

const convertToIDR = (amount: number, currency: string): number => {
  if (currency === 'IDR') return amount;
  const rate = getExchangeRate(currency);
  return amount * rate;
};

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetRequest)
    private requestRepo: Repository<BudgetRequest>,
    @InjectRepository(BudgetRevision)
    private revisionRepo: Repository<BudgetRevision>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  // ========== BUDGET MANAGEMENT ==========
  async getAllBudgets() {
    return await this.budgetRepo.find({
      where: { is_active: true },
      relations: ['department_rel'],
      order: { fiscal_year: 'DESC', department_name: 'ASC' },
    });
  }

  async getBudgetById(id: number) {
    try {
      const budget = await this.budgetRepo.findOne({
        where: { id },
        relations: ['department_rel'],
      });

      if (!budget) {
        throw new Error('Budget not found');
      }

      return budget;
    } catch (error) {
      console.error('Error getting budget by id:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get budget: ${error.message}`);
      }
      throw new Error('Failed to get budget');
    }
  }
  async createBudget(data: any) {
    try {
      if (!data.department_name) {
        throw new Error('Department name is required');
      }

      // Check if department exists
      const department = await this.departmentRepo.findOne({
        where: { name: data.department_name },
      });

      if (!department) {
        const newDept = await this.departmentRepo.save({
          name: data.department_name,
          is_active: true,
        });
        console.log(
          `✅ Department ${data.department_name} created automatically`,
        );
      }

      const totalAmount = Number(data.total_amount) || 0;
      const currency = data.currency || 'IDR';
      const exchangeRate = getExchangeRate(currency);
      const totalAmountIdr = convertToIDR(totalAmount, currency);

      const remainingAmount = totalAmount;
      const remainingAmountIdr = totalAmountIdr;
      const usedAmount = 0;
      const usedAmountIdr = 0;
      const reservedAmount = Number(data.reserved_amount) || 0;
      const reservedAmountIdr = convertToIDR(reservedAmount, currency);

      const periodStart = data.period_start || null;
      const periodEnd = data.period_end || null;
      const budgetOwner = data.budget_owner || null;
      const budgetCode = data.budget_code || null;
      const revisionNo = data.revision_no || 0;
      const lastRevisionAt = data.last_revision_at || null;

      const convertTo = data.convert_to || null;
      const exchangeRateInput = data.exchange_rate || null;
      const convertedAmount = data.converted_amount || null;

      const budget = this.budgetRepo.create({
        fiscal_year: data.fiscal_year,
        department_name: data.department_name,
        budget_type: data.budget_type,
        budget_name: data.budget_name,
        budget_code: budgetCode,
        description: data.description || null,
        currency,
        exchange_rate: exchangeRate,
        total_amount: totalAmount,
        total_amount_idr: totalAmountIdr,
        remaining_amount: remainingAmount,
        remaining_amount_idr: remainingAmountIdr,
        used_amount: usedAmount,
        used_amount_idr: usedAmountIdr,
        reserved_amount: reservedAmount,
        reserved_amount_idr: reservedAmountIdr,
        period_start: periodStart,
        period_end: periodEnd,
        budget_owner: budgetOwner,
        revision_no: revisionNo,
        last_revision_at: lastRevisionAt,
        is_active: true,

        // Field untuk konversi
        convert_to: convertTo,
        exchange_rate_input: exchangeRateInput,
        converted_amount: convertedAmount,
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
        where: { id },
      });

      if (!existingBudget) {
        throw new Error('Budget not found');
      }

      const updateData: Partial<Budget> = {};

      // Basic fields
      if (data.budget_name) updateData.budget_name = data.budget_name;
      if (data.budget_type) updateData.budget_type = data.budget_type;
      if (data.department_name)
        updateData.department_name = data.department_name;
      if (data.fiscal_year) updateData.fiscal_year = data.fiscal_year;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.budget_code !== undefined)
        updateData.budget_code = data.budget_code;
      if (data.budget_owner !== undefined)
        updateData.budget_owner = data.budget_owner;
      if (data.period_start !== undefined)
        updateData.period_start = data.period_start;
      if (data.period_end !== undefined)
        updateData.period_end = data.period_end;

      // Currency fields
      if (data.currency) {
        updateData.currency = data.currency;
        updateData.exchange_rate = getExchangeRate(data.currency);
      }

      // Jika total amount diubah
      if (
        data.total_amount &&
        Number(data.total_amount) !== Number(existingBudget.total_amount)
      ) {
        updateData.total_amount = data.total_amount;

        const currency = data.currency || existingBudget.currency;
        const totalAmountIdr = convertToIDR(
          Number(data.total_amount),
          currency,
        );
        updateData.total_amount_idr = totalAmountIdr;

        updateData.remaining_amount =
          Number(data.total_amount) - Number(existingBudget.used_amount);
        updateData.remaining_amount_idr =
          totalAmountIdr - Number(existingBudget.used_amount_idr);
      }

      if (data.reserved_amount !== undefined) {
        updateData.reserved_amount = data.reserved_amount;
        const currency = data.currency || existingBudget.currency;
        updateData.reserved_amount_idr = convertToIDR(
          Number(data.reserved_amount),
          currency,
        );
      }

      await this.budgetRepo.update(id, updateData);

      const updatedBudget = await this.budgetRepo.findOne({
        where: { id },
        relations: ['department_rel'],
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
        where: { budget_id: id },
      });

      if (hasRequests > 0) {
        await this.budgetRepo.update(id, { is_active: false });
        return {
          message: 'Budget has related requests, set to inactive instead',
          softDelete: true,
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
    try {
      console.log('Fetching all budget requests...');

      const requests = await this.requestRepo.find({
        relations: ['budget'],
        order: { created_at: 'DESC' },
      });

      console.log(`Found ${requests.length} requests`);
      return requests;
    } catch (error) {
      console.error('Error in getAllRequests:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch requests: ${error.message}`);
      }
      throw new Error('Failed to fetch requests');
    }
  }

  async createRequest(data: any) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');

      const lastRequest = await this.requestRepo.findOne({
        where: { request_no: Like(`REQ/${year}/${month}/%`) },
        order: { id: 'DESC' },
      });

      let sequence = '001';
      if (lastRequest) {
        const lastSeq = parseInt(
          lastRequest.request_no.split('/').pop() || '0',
        );
        sequence = String(lastSeq + 1).padStart(3, '0');
      }

      const request_no = `REQ/${year}/${month}/${sequence}`;

      // Validasi budget exists
      let budgetCurrency = 'IDR';
      let exchangeRate = 1;

      if (data.budget_id) {
        const budget = await this.budgetRepo.findOne({
          where: { id: data.budget_id },
        });
        if (!budget) {
          throw new Error(`Budget with ID ${data.budget_id} not found`);
        }
        budgetCurrency = budget.currency;
        exchangeRate = budget.exchange_rate || 1;
      }

      const currency = data.currency || budgetCurrency;
      const rate = getExchangeRate(currency);

      const estimatedUnitPrice = Number(data.estimated_unit_price) || 0;
      const quantity = Number(data.quantity) || 0;
      const estimatedTotal = estimatedUnitPrice * quantity;

      const estimatedUnitPriceIdr = convertToIDR(estimatedUnitPrice, currency);
      const estimatedTotalIdr = convertToIDR(estimatedTotal, currency);

      const request = this.requestRepo.create({
        request_no,
        requester_name: data.requester_name,
        requester_badge: data.requester_badge,
        department: data.department,
        request_type: data.request_type,
        item_name: data.item_name,
        specification: data.specification,
        quantity: quantity,
        currency,
        exchange_rate: rate,
        estimated_unit_price: estimatedUnitPrice,
        estimated_unit_price_idr: estimatedUnitPriceIdr,
        estimated_total: estimatedTotal,
        estimated_total_idr: estimatedTotalIdr,
        budget_type: data.budget_type,
        budget_id: data.budget_id,
        notes: data.notes || null,
        status: 'DRAFT',
      });

      const saved = await this.requestRepo.save(request);
      console.log('Request created:', saved.request_no);

      return saved;
    } catch (error) {
      console.error('Error creating request:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create request: ${error.message}`);
      }
      throw new Error('Failed to create request');
    }
  }

  async deleteRequest(id: number) {
    try {
      const request = await this.requestRepo.findOne({
        where: { id },
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status === 'BUDGET_APPROVED') {
        throw new Error('Cannot delete approved request');
      }

      if (request.reserved_amount > 0 && request.budget_id) {
        const budget = await this.budgetRepo.findOne({
          where: { id: request.budget_id },
        });

        if (budget) {
          // Kembalikan dana yang di-reserved
          budget.remaining_amount =
            Number(budget.remaining_amount) + Number(request.reserved_amount);
          budget.used_amount =
            Number(budget.used_amount) - Number(request.reserved_amount);
          budget.remaining_amount_idr =
            Number(budget.remaining_amount_idr) +
            Number(request.reserved_amount_idr);
          budget.used_amount_idr =
            Number(budget.used_amount_idr) -
            Number(request.reserved_amount_idr);

          await this.budgetRepo.save(budget);
        }
      }
      const result = await this.requestRepo.delete(id);

      if (result.affected === 0) {
        throw new Error('Request not found');
      }

      return {
        message: 'Request deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting request:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete request: ${error.message}`);
      }
      throw new Error('Failed to delete request');
    }
  }

  async submitRequest(id: number) {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['budget'],
    });

    if (!request) throw new Error('Request not found');

    const budget = await this.budgetRepo.findOne({
      where: { id: request.budget_id },
    });

    if (!budget) throw new Error('Budget not found');

    if (budget.remaining_amount >= request.estimated_total) {
      // Update budget
      budget.remaining_amount =
        Number(budget.remaining_amount) - Number(request.estimated_total);
      budget.used_amount =
        Number(budget.used_amount) + Number(request.estimated_total);
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

  // Revision
  async getAllRevisions() {
    return await this.revisionRepo.find({
      relations: ['request', 'budget'],
      order: { created_at: 'DESC' },
    });
  }

  async createRevision(data: any) {
    try {
      // Validasi request exists
      const request = await this.requestRepo.findOne({
        where: { id: data.request_id },
      });

      if (!request) {
        throw new Error('Request not found');
      }

      // Validasi budget exists
      const budget = await this.budgetRepo.findOne({
        where: { id: data.budget_id },
      });

      if (!budget) {
        throw new Error('Budget not found');
      }

      // Simpan snapshot data lama untuk history
      const previousData = {
        request: { ...request },
        budget: { ...budget },
      };

      // Update budget dengan amount baru
      const oldAmount = Number(request.estimated_total);
      const newAmount = Number(data.new_amount);
      const difference = oldAmount - newAmount;

      // Update remaining amount di budget
      budget.remaining_amount = Number(budget.remaining_amount) + difference;
      budget.remaining_amount_idr = convertToIDR(
        budget.remaining_amount,
        budget.currency,
      );

      // Update used amount di budget
      budget.used_amount = Number(budget.used_amount) - difference;
      budget.used_amount_idr = convertToIDR(
        budget.used_amount,
        budget.currency,
      );

      // Update revision number
      budget.revision_no = (budget.revision_no || 0) + 1;
      budget.last_revision_at = new Date();

      // Update request dengan amount baru
      request.estimated_total = newAmount;
      request.estimated_total_idr = convertToIDR(newAmount, request.currency);
      request.notes = data.notes || request.notes;

      // Simpan perubahan
      await this.budgetRepo.save(budget);
      await this.requestRepo.save(request);

      // Simpan revision history
      const revision = this.revisionRepo.create({
        request_id: data.request_id,
        budget_id: data.budget_id,
        original_amount: data.original_amount,
        new_amount: data.new_amount,
        reduction_percentage: data.reduction_percentage,
        currency: data.currency,
        reason: data.reason,
        previous_data: previousData,
        revised_by: data.revised_by || 'system',
      });

      return await this.revisionRepo.save(revision);
    } catch (error) {
      console.error('Error creating revision:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create revision: ${error.message}`);
      }
      throw new Error('Failed to create revision');
    }
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
      where: { status: 'SUBMITTED' },
    });

    const approvedRequests = await this.requestRepo.count({
      where: { status: 'BUDGET_APPROVED' },
    });

    return {
      total_budget: totalBudget.total || 0,
      total_remaining: totalRemaining.total || 0,
      pending_requests: pendingRequests,
      approved_requests: approvedRequests,
      budget_used: (totalBudget.total || 0) - (totalRemaining.total || 0),
    };
  }
}
