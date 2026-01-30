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

  async syncBatch(
    transactions: CreateTransactionDto[],
    userId: number,
    branchId: number,
  ) {
    let syncedCount = 0;
    let duplicatesSkipped = 0;

    for (const txDto of transactions) {
      try {
        // 1. Check if transaction with same UUID exists
        if (txDto.id) {
          const existing = await this.prisma.transaction.findUnique({
            where: { id: txDto.id },
          });

          if (existing) {
            duplicatesSkipped++;
            continue; // Idempotency: Skip if already exists
          }
        }

        // 2. Create transaction
        await this.prisma.transaction.create({
          data: {
            id: txDto.id, // Use the UUID from offline
            isOfflineSynced: true,
            branch: { connect: { id: branchId } },
            user: { connect: { id: userId } },
            status: 'PAID',
            transactionDate: txDto.transactionDate
              ? new Date(txDto.transactionDate)
              : new Date(),
            paymentMethod: txDto.paymentMethod,
            totalAmount: txDto.totalAmount,
            cashReceived: txDto.cashReceived,
            transactionItems: {
              create: txDto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtTransaction: item.price,
                subtotal: item.price * item.quantity,
              })),
            },
          },
        });

        syncedCount++;
      } catch (error) {
        // Log error but continue
        console.error('Error syncing transaction:', error);
      }
    }

    return { syncedCount, duplicatesSkipped };
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
