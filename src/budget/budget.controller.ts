import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BudgetService } from './budget.service';

@Controller('api/budget')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  // ===== BUDGET CRUD =====
  @Get('list')
  getAllBudgets() {
    return this.budgetService.getAllBudgets();
  }

   @Get('detail/:id')
  getBudgetById(@Param('id') id: number) {
    return this.budgetService.getBudgetById(id);
  }

  @Post('create')
  createBudget(@Body() data: any) {
    return this.budgetService.createBudget(data);
  }

  @Put('update/:id')
  updateBudget(@Param('id') id: number, @Body() data: any) {
    return this.budgetService.updateBudget(id, data);
  }

  @Delete('delete/:id')
  deleteBudget(@Param('id') id: number) {
    return this.budgetService.deleteBudget(id);
  }

  // ===== REQUESTS =====
  @Get('requests')
  getAllRequests() {
    return this.budgetService.getAllRequests();
  }

  @Post('request/create')
  createRequest(@Body() data: any) {
    return this.budgetService.createRequest(data);
  }

  @Delete('request/delete/:id')
  deleteRequest(@Param('id') id: number) {
    return this.budgetService.deleteRequest(id);
  }

  @Put('request/submit/:id')
  submitRequest(@Param('id') id: number) {
    return this.budgetService.submitRequest(id);
  }

  @Put('request/choose/:id/:tipe')
  chooseSRMR(@Param('id') id: number, @Param('tipe') tipe: 'SR' | 'MR') {
    return this.budgetService.chooseSRMR(id, tipe);
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.budgetService.getDashboardStats();
  }

  // ===== REVISIONS =====
  @Get('revisions/list')
  getallRevisions() {
    return this.budgetService.getAllRevisions();

  }

  @Post('revision/create')
  createRevision(@Body() data: any) {
    return this.budgetService.createRevision(data);
  }
}
