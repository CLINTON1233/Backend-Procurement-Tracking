import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../database/entities/Department.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  async getAllDepartments() {
    return await this.departmentRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' }
    });
  }

  async createDepartment(data: { name: string; description?: string }) {
    const department = this.departmentRepo.create(data);
    return await this.departmentRepo.save(department);
  }

  async seedDepartments() {
    const departments = [
      "SUBCONT", "Blasting & Painting", "Canteen", "CLIENT - AL-SHAHEEN GALLAF",
      "CLIENT - CHANGHUA", "Client Equinor", "CLIENT SOFIA", "CLIENT - TENNET",
      "Contract", "E&l and Automation", "Engineering", "Finance", "HR & Admin",
      "HSE", "HSSE", "Internship", "IT", "IV-ONE", "TYM", "Machinery",
      "Marketing", "Operation & Maintenance", "Piping", "Planning", "PMT Beta",
      "PMT Changhua", "PMT Empire", "PMT Gamma", "PMT Nederwiek-Beta",
      "PMT Petrobas", "PMT Pluto", "PMT Sofia", "Procurement",
      "Project Management", "PT. Adiartha Suwabuana", "PT. Guna Sarana Konstruksi",
      "PT HENRY GLOBAL MANDIRI", "PT KARYA BARU RIMA", "PT. Rajawali", "QA & QC",
      "Seatrium Empire", "Seatrium Tennet", "Security", "Shipwright",
      "Structure & Outfitting", "Subcont Leads Technologies Corporation Pte Ltd",
      "Sub Contractor Alkatra (Bechtel)", "Sub Contractor ANGKASA",
      "Sub Contractor DYNATECH", "Sub Contractor MAHANTARA", "Sub Contractor NOV",
      "Sub Contractor PT JENERIC JAYA", "TRISEA", "Uso Marine", "Warehouse",
      "Works", "Yard"
    ];

    for (const deptName of departments) {
      const existing = await this.departmentRepo.findOne({ where: { name: deptName } });
      if (!existing) {
        await this.departmentRepo.save({ name: deptName });
      }
    }

    return { message: 'Departments seeded successfully' };
  }
}