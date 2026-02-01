import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AuditLogWhereUniqueInput;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    // Get total count for pagination
    const total = await this.prisma.auditLog.count({ where });

    const data = await this.prisma.auditLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      data,
      total,
      page: skip && take ? Math.floor(skip / take) + 1 : 1,
      lastPage: take ? Math.ceil(total / take) : 1,
    };
  }

  async create(
    data: Prisma.AuditLogCreateInput | Prisma.AuditLogUncheckedCreateInput,
  ) {
    return this.prisma.auditLog.create({ data });
  }
}
