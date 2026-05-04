import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

// Map Prisma order to frontend-compatible flat shape
function mapOrder(o: any) {
  return {
    ...o,
    cashierName: o.cashier?.name ?? '',
    customerName: o.customer?.name ?? undefined,
    customerId: o.customerId ?? o.customer?.id ?? undefined,
    subtotal: Number(o.subtotal),
    taxAmount: Number(o.taxAmount),
    discountAmount: Number(o.discountAmount),
    total: Number(o.total),
    status: (o.status as string).toLowerCase() as any,
    items: (o.items ?? []).map((i: any) => ({
      productId: i.productId,
      productName: i.name ?? i.product?.name ?? '',
      barcode: i.product?.barcode ?? '',
      quantity: i.quantity,
      unitPrice: Number(i.price),
      discount: Number(i.discount ?? 0),
      total: Number(i.price) * i.quantity - Number(i.discount ?? 0),
    })),
    payment: o.payment
      ? {
          id: o.payment.id ?? '',
          orderId: o.id,
          splits: [
            {
              method: (o.payment.method as string).toLowerCase(),
              amount: Number(o.payment.amount),
            },
          ],
          total: Number(o.payment.amount),
          change: Number(o.payment.change ?? 0),
          createdAt:
            o.payment.paidAt?.toISOString?.() ?? new Date().toISOString(),
        }
      : undefined,
  };
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private TAX_RATE = 0.07;

  async findAll(
    query: PaginationDto & { status?: string; from?: string; to?: string },
  ) {
    const { page = 1, limit = 20, search, status, from, to } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      ...(search && { orderNumber: { contains: search } }),
      ...(status && { status: status.toUpperCase() }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          customer: { select: { id: true, name: true } },
          cashier: { select: { id: true, name: true } },
          payment: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: items.map(mapOrder),
      total,
      page,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
        customer: true,
        cashier: { select: { id: true, name: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return mapOrder(order);
  }

  async create(dto: CreateOrderDto, cashierId: string) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { stock: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if ((product.stock?.quantity ?? 0) < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
    }

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const lineTotal = Number(product.price) * item.quantity - (item.discount ?? 0);
      subtotal += lineTotal;
      return {
        productId: item.productId,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        discount: item.discount ?? 0,
      };
    });

    const discountAmount = 0;
    const taxAmount = (subtotal - discountAmount) * this.TAX_RATE;
    const total = subtotal - discountAmount + taxAmount;
    const orderNumber = `ORD-${Date.now()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          cashierId,
          customerId: dto.customerId,
          status: 'PAID',
          subtotal,
          taxAmount,
          discountAmount,
          total,
          couponCode: dto.couponCode,
          note: dto.note,
          items: { create: orderItems },
          payment: {
            create: {
              method: dto.paymentMethod as any,
              amount: dto.paymentAmount,
              change: Math.max(0, dto.paymentAmount - total),
            },
          },
        },
        include: { items: true, payment: true, cashier: { select: { id: true, name: true } }, customer: true },
      });

      for (const item of dto.items) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            note: `Order ${orderNumber}`,
          },
        });
      }

      return created;
    });

    return mapOrder(order);
  }

  async voidOrder(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'paid') {
      throw new BadRequestException('Only PAID orders can be voided');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: true, payment: true,
        customer: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
      },
    });
    return mapOrder(updated);
  }
}

