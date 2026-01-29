import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number,
    branchId: number,
  ) {
    const transaction = await this.prisma.transaction.create({
      data: {
        // Use connect for relations
        branch: {
          connect: { id: branchId },
        },
        user: {
          connect: { id: userId },
        },
        status: 'PAID',
        transactionDate: new Date(),
        paymentMethod: createTransactionDto.paymentMethod,
        totalAmount: createTransactionDto.totalAmount,
        cashReceived: createTransactionDto.cashReceived,
        transactionItems: {
          create: createTransactionDto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTransaction: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        transactionItems: true,
      },
    });

    return transaction;
  }

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
