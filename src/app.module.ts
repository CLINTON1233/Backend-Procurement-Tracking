import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './database/entities/Budget.entity';
import { BudgetRequest } from './database/entities/BudgetRequest.entity';
import { Department } from './database/entities/Department.entity';
import { BudgetRevision } from './database/entities/BudgetRevision.entity'; 
import { BudgetModule } from './budget/budget.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Sukses12345', 
      database: 'procurement',
      entities: [Budget, BudgetRequest, Department, BudgetRevision],
      synchronize: true, 
    }),
    BudgetModule,
    DepartmentModule,
  ],
})
export class AppModule {}