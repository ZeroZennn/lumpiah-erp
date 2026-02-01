import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  async findAll(
    userId: number,
    skip: number = 0,
    take: number = 20,
    isRead?: boolean,
  ) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async notifyAdmins(title: string, description: string, link?: string) {
    // efficient handling: find all admin/owner IDs first
    const admins = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: {
            in: ['Owner', 'Admin'],
          },
        },
      },
      select: { id: true },
    });

    const notifications = admins.map((admin) => ({
      userId: admin.id,
      title,
      description,
      link,
      isRead: false,
    }));

    // Batch insert
    return this.prisma.notification.createMany({
      data: notifications,
    });
  }
}
