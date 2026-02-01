import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  async getDashboardStats(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDashboardStats({
      branchId: branchId ? Number(branchId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('trends')
  async getRevenueTrend(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueTrend({
      branchId: branchId ? Number(branchId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('branch-performance')
  async getBranchPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getBranchPerformance({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('operational-status')
  async getOperationalStatus(@Query('date') date?: string) {
    return this.reportsService.getOperationalStatus(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('production-summary')
  async getProductionSummary(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getProductionSummary({
      branchId: branchId ? Number(branchId) : undefined,
      date: date ? new Date(date) : new Date(),
    });
  }

  @Get('operational')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Owner')
  async getOperationalReport(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getOperationalReport({
      branchId: branchId ? Number(branchId) : undefined,
      date: date ? new Date(date) : new Date(),
    });
  }
}
