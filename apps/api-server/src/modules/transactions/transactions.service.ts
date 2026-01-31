import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindAllTransactionsDto } from './dto/find-all-transactions.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ... (private helpers omitted, no change needed) ...

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/\u00a0/g, ' '); // Replace NBSP with normal space
  }

  private formatDate(date: Date) {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

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

  async findAll(query: FindAllTransactionsDto) {
    const {
      branchId,
      startDate,
      endDate,
      status,
      search,
      isOfflineSynced,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (typeof isOfflineSynced !== 'undefined') {
      where.isOfflineSynced = isOfflineSynced;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.transactionDate = {
        gte: new Date(startDate),
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { fullname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          user: { select: { fullname: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async generateCsv(query: FindAllTransactionsDto): Promise<string> {
    // Fetch all data matching filters (no limit)
    const exportQuery = { ...query, page: 1, limit: 100000 };
    const { data } = await this.findAll(exportQuery);

    // Define Headers
    const headers = [
      'No',
      'Waktu',
      'Cabang',
      'Kasir',
      'Metode',
      'Status',
      'Sumber Data',
      'Total',
    ].join(';'); // Use semicolon for Excel ID region

    // Map Data
    const rows = data.map((tx, index) => {
      return [
        index + 1,
        `"${this.formatDate(new Date(tx.transactionDate))}"`,
        `"${tx.branch.name}"`,
        `"${tx.user.fullname}"`,
        tx.paymentMethod || '-',
        tx.status,
        tx.isOfflineSynced ? 'Offline (Synced)' : 'Online',
        `"${this.formatCurrency(Number(tx.totalAmount))}"`,
      ].join(';');
    });

    return '\uFEFF' + [headers, ...rows].join('\n'); // Add BOM
  }

  async getSummary(query: FindAllTransactionsDto) {
    const { branchId, startDate, endDate, search, isOfflineSynced } = query;
    // Reuse filter logic (extract logic to private method if possible, but for now duplicate the `where` construction for safety)
    const where: Prisma.TransactionWhereInput = {};

    if (branchId) where.branchId = branchId;

    if (typeof isOfflineSynced !== 'undefined') {
      where.isOfflineSynced = isOfflineSynced;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.transactionDate = {
        gte: new Date(startDate),
      };
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { fullname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Total Revenue (PAID only)
    const revenueAgg = await this.prisma.transaction.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Void Stats
    const voidAgg = await this.prisma.transaction.aggregate({
      where: { ...where, status: 'VOID' },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      totalRevenue: revenueAgg._sum.totalAmount || 0,
      paidCount: revenueAgg._count.id || 0,
      totalVoid: voidAgg._count.id || 0,
      voidAmount: voidAgg._sum.totalAmount || 0,
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        transactionItems: {
          include: { product: true },
        },
        user: true,
        branch: true,
      },
    });

    if (!transaction) throw new Error('Transaction not found');
    return transaction;
  }

  async voidTransaction(
    id: string,
    dto: VoidTransactionDto,
    requesterUserId: number,
  ) {
    const transaction = await this.findOne(id);

    if (transaction.status === 'VOID') {
      throw new BadRequestException('Transaction is already voided');
    }

    if (transaction.status !== 'PAID') {
      throw new BadRequestException('Only PAID transactions can be voided');
    }

    // 1. Verify Admin Credential
    const adminUser = await this.prisma.user.findUnique({
      where: { email: dto.adminUsername }, // Assuming username is email based on schema
      include: { role: true },
    });

    if (!adminUser) {
      throw new NotFoundException(
        'Otorisasi Admin Gagal: Admin tidak ditemukan',
      );
    }

    if (adminUser.role.name !== 'Admin' && adminUser.role.name !== 'Owner') {
      throw new ForbiddenException('Otorisasi Admin Gagal: User bukan Admin');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.adminPassword,
      adminUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Password Admin Salah');
    }

    // 2. Check Daily Closing Status
    const txDate = new Date(transaction.transactionDate);
    const dateOnly = new Date(
      txDate.getFullYear(),
      txDate.getMonth(),
      txDate.getDate(),
    );

    const closing = await this.prisma.dailyClosing.findFirst({
      where: {
        branchId: transaction.branchId,
        closingDate: dateOnly,
      },
    });

    if (closing) {
      throw new Error(
        'Cannot void transaction: Daily closing already performed for this date.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 3. Update Transaction Status
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          status: 'VOID',
          voidReason: dto.reason,
        },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: requesterUserId, // The user who initiated the request (likely cashier)
          actionType: 'VOID',
          targetTable: 'Transaction',
          targetId: id,
          oldValue: { status: transaction.status } as Prisma.InputJsonValue,
          newValue: {
            status: 'VOID',
            reason: dto.reason,
            approvedBy: adminUser.email,
          } as Prisma.InputJsonValue,
        },
      });

      return updatedTx;
    });
  }

  async rejectVoid(id: string) {
    // Revert PENDING_VOID to PAID
    await this.findOne(id);

    // Only process if currently pending void (if implemented) or just ignore
    // Assuming 'PENDING_VOID' is a status used when cashier requests it.

    return await this.prisma.transaction.update({
      where: { id },
      data: {
        status: 'PAID', // Revert to paid usually
        voidReason: null, // Clear reason or keep as history? Better clean for logic sake or keep in separate log
      },
    });
  }
}
