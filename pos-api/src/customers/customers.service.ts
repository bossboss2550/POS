import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
          isActive: true,
        }
      : { isActive: true };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, skip, take: limitNum, orderBy: { name: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { data: items, total, page: pageNum, pageSize: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async getOrders(id: string, query: PaginationDto) {
    await this.findOne(id);
    const { page = 1, limit = 10 } = query;
    const pageNum2 = +page;
    const limitNum2 = +limit;
    const skip = (pageNum2 - 1) * limitNum2;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { customerId: id },
        skip,
        take: limitNum2,
        include: { payment: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { customerId: id } }),
    ]);
    return { data: items, total, page: pageNum2, pageSize: limitNum2, totalPages: Math.ceil(total / limitNum2) };
  }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: { isActive: false } });
  }
}


