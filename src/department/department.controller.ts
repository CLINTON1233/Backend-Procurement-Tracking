import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('api/departments')
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Get('list')
  getAllDepartments() {
    return this.departmentService.getAllDepartments();
  }

  @Post('create')
  createDepartment(@Body() data: { name: string; description?: string }) {
    return this.departmentService.createDepartment(data);
  }

  @Post('seed')
  seedDepartments() {
    return this.departmentService.seedDepartments();
  }
}