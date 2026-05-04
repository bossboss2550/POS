import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function mapProduct(product: any) {
  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost ?? 0),
    stock: product.stock?.quantity ?? 0,
    minStock: product.stock?.minQuantity ?? 5,
    categoryId: product.categoryId ?? product.category?.id,
    image: product.imageUrl ?? undefined,
  };
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { categoryId?: string; lowStock?: boolean }) {
    const { page = 1, limit = 20, search, categoryId, lowStock } = query;
    const pageNum = +page;
    const limitNum = +limit;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(categoryId && { categoryId }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: { category: true, stock: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    let mapped = items.map(mapProduct);
    if (lowStock) {
      mapped = mapped.filter((product) => product.stock <= product.minStock);
    }

    return {
      data: mapped,
      total,
      page: pageNum,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, stock: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return mapProduct(product);
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: { category: true, stock: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return mapProduct(product);
  }

  async create(dto: CreateProductDto) {
    const { stock, minStock, imageUrl, ...productData } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        imageUrl: imageUrl || null,
        price: productData.price,
        cost: productData.cost ?? 0,
        stock: { create: { quantity: stock ?? 0, minQuantity: minStock ?? 5 } },
      },
      include: { category: true, stock: true },
    });

    return mapProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { stock, minStock, imageUrl, ...productData } = dto;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(stock !== undefined ? { stock: { update: { quantity: stock } } } : {}),
        ...(minStock !== undefined ? { stock: { update: { minQuantity: minStock } } } : {}),
      },
      include: { category: true, stock: true },
    });

    return mapProduct(product);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
