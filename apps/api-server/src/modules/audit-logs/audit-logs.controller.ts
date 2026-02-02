import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Owner', 'Admin') // Only Owner and Admin can view audit logs
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('targetTable') targetTable?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const take = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * take;

    const where: Prisma.AuditLogWhereInput = {};

    // Date Range Filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // User Filter
    if (userId && userId !== 'all') {
      where.userId = parseInt(userId);
    }

    // Action Type Filter
    if (actionType && actionType !== 'all') {
      where.actionType = actionType;
    }

    // Feature/TargetTable Filter
    if (targetTable && targetTable !== 'all') {
      where.targetTable = targetTable;
    }

    // Search (Target ID)
    if (search) {
      where.OR = [
        { targetId: { contains: search, mode: 'insensitive' } },
        // If we want search to also cover targetTable without conflicting with filter
        { targetTable: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.auditLogsService.findAll({
      skip,
      take,
      where,
      orderBy: { timestamp: 'desc' },
    });
  }
}
