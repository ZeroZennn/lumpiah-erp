import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InputJsonValue } from '@prisma/client/runtime/library';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

interface PriceAuditValue {
  price: number;
  branchId: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: {},
      include: {
        category: true,
        branchProductPrices: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to include category name and final price
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      category: product.category.name,
      unit: product.unit,
      price: product.branchProductPrices[0]?.price || product.basePrice,
      basePrice: product.basePrice,
      branchProductPrices: product.branchProductPrices,
      isActive: product.isActive,
    }));
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        unit: data.unit ?? 'pcs',
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async updatePrice(
    id: number,
    data: UpdateProductPriceDto,
    userId: number = 1,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        branchProductPrices: {
          where: { branchId: data.branchId, productId: id },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const oldPrice = product.branchProductPrices[0]?.price;

    // Upsert price for specific branch
    const result = await this.prisma.branchProductPrice.upsert({
      where: {
        branchId_productId: {
          branchId: data.branchId,
          productId: id,
        },
      },
      create: {
        branchId: data.branchId,
        productId: id,
        price: data.price,
      },
      update: {
        price: data.price,
      },
    });

    // Create Audit Log
    // Mock user ID 1 for now if not provided, or passed from controller
    const oldValue: PriceAuditValue | null = oldPrice
      ? { price: Number(oldPrice), branchId: data.branchId }
      : null;
    const newValue: PriceAuditValue = {
      price: Number(data.price),
      branchId: data.branchId,
    };

    await this.prisma.auditLog.create({
      data: {
        userId: userId, // Default or actual ID
        actionType: 'UPDATE_PRICE',
        targetTable: 'products',
        targetId: String(id),
        oldValue: oldValue as unknown as InputJsonValue,
        newValue: newValue as unknown as InputJsonValue,
        ipAddress: '127.0.0.1', // Mock IP
      },
    });

    return result;
  }

  async getPriceHistory(productId: number) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        targetTable: 'products',
        targetId: String(productId),
        actionType: 'UPDATE_PRICE',
      },
      include: {
        user: {
          select: { fullname: true },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const branchIds = new Set<number>();
    logs.forEach((log) => {
      const val = log.newValue as unknown as PriceAuditValue;
      if (val?.branchId) branchIds.add(val.branchId);
    });

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: Array.from(branchIds) } },
      select: { id: true, name: true },
    });

    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    return logs.map((log) => {
      const newVal = log.newValue as unknown as PriceAuditValue;
      const oldVal = log.oldValue as unknown as PriceAuditValue;
      return {
        id: log.id.toString(),
        user: log.user.fullname,
        timestamp: log.timestamp,
        branchName: branchMap.get(newVal?.branchId) || 'Unknown Branch',
        price: newVal?.price,
        oldPrice: oldVal?.price,
      };
    });
  }
}
