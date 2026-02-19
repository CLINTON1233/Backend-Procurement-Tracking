import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../database/entities/Budget.entity';
import { BudgetRequest } from '../database/entities/BudgetRequest.entity';
import { Department } from '../database/entities/Department.entity'; // IMPORT Department
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetRequest, Department]), // TAMBAHKAN Department di sini
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}