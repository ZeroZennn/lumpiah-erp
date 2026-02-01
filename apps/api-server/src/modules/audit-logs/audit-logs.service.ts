import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const log = await this.prisma.auditLog.create({ data });

    // Generate Link and Description
    let link: string | undefined;
    let description = `${data.actionType} on ${data.targetTable}`;
    const table = data.targetTable?.toLowerCase();

    if (table === 'products' || table === 'product') {
      const val = (data.newValue as { name?: string }) || {};
      // If we have a name, search by it, otherwise just go to products
      if (val?.name) {
        link = `/products?q=${encodeURIComponent(val.name)}`;
        description = `${data.actionType} Product: ${val.name}`;
      } else {
        link = `/products`;
        description = `${data.actionType} Product`;
      }
    } else if (table === 'transaction' || table === 'transactions') {
      // Transactions usually searched by ID
      link = `/transactions?search=${data.targetId}`;
      description = `${data.actionType} Transaction #${data.targetId}`;
    } else if (table === 'dailyclosing' || table === 'daily_closing') {
      link = `/reports/daily-closings`;
      description = `${data.actionType} Daily Closing`;
    }

    // Persist Notification
    await this.notificationsService.notifyAdmins(
      'New System Activity',
      description,
      link,
    );

    console.log('Emitting new_audit_log event for id:', log.id);
    this.notificationGateway.sendNewAuditLog(log);

    return log;
  }
}
