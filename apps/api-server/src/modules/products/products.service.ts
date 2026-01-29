import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
      },
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
      category: product.category.name,
      unit: product.unit,
      price: product.branchProductPrices[0]?.price || product.basePrice,
      basePrice: product.basePrice,
      isActive: product.isActive,
    }));
  }
}
