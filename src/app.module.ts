import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './database/entities/Budget.entity';
import { BudgetRequest } from './database/entities/BudgetRequest.entity';
import { BudgetModule } from './budget/budget.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Sukses12345', 
      database: 'procurement',
      entities: [Budget, BudgetRequest],
      synchronize: true, 
    }),
    BudgetModule,
  ],
})
export class AppModule {}