import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../database/entities/Budget.entity';
import { BudgetRequest } from '../database/entities/BudgetRequest.entity';
import { Department } from '../database/entities/Department.entity';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { DepartmentModule } from '../department/department.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetRequest, Department]),
    DepartmentModule, 
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}