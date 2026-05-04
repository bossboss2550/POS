import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { lowStock?: boolean }) {
    const { page = 1, limit = 20, search, lowStock } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      product: {
        isActive: true,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stock.findMany({
        where,
        skip,
        take: limitNum,
        include: { product: { include: { category: true } } },
        orderBy: { product: { name: 'asc' } },
      }),
      this.prisma.stock.count({ where }),
    ]);

    const filtered = lowStock
      ? items.filter((s) => s.quantity <= s.minQuantity)
      : items;

    return { data: filtered, total, page: pageNum, pageSize: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async getMovements(productId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: { productId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);
    return { data: items, total, page: pageNum, pageSize: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async adjust(productId: string, dto: AdjustStockDto) {
    const stock = await this.prisma.stock.findUnique({ where: { productId } });
    if (!stock) throw new BadRequestException('Product stock record not found');

    const newQty = stock.quantity + dto.quantity;
    if (newQty < 0) throw new BadRequestException('Insufficient stock');

    return this.prisma.$transaction([
      this.prisma.stock.update({
        where: { productId },
        data: { quantity: newQty },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId,
          type: dto.type as any,
          quantity: dto.quantity,
          note: dto.note,
        },
      }),
    ]);
  }

  async getAllMovements(query: PaginationDto) {
    const { page = 1, limit = 50 } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        skip,
        take: limitNum,
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count(),
    ]);
    const data = items.map((m: any) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name ?? '',
      type: m.type,
      quantity: m.quantity,
      beforeStock: 0,
      afterStock: m.quantity,
      reason: m.note ?? '',
      userId: '',
      createdAt: m.createdAt,
    }));
    return { data, total, page: pageNum, pageSize: limitNum, totalPages: Math.ceil(total / limitNum) };
  }}


