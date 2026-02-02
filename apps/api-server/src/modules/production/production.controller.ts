import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { SubmitRealizationDto } from './dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('plans')
  async getPlans(
    @Query('branchId', ParseIntPipe) branchId: number,
    @Query('date') date: string,
    @Query('init') init?: string,
  ) {
    if (!date) throw new BadRequestException('Date is required');
    return this.productionService.getPlans(branchId, date, init === 'true');
  }

  @Post('realization')
  async submitRealization(@Body() dto: SubmitRealizationDto) {
    // Hardcoded userId 1 for MVP
    return this.productionService.submitRealization(1, dto);
  }

  @Get('accuracy')
  async getAccuracy(
    @Query('branchId', ParseIntPipe) branchId: number,
    @Query('date') date: string,
  ) {
    return this.productionService.getAccuracyReport(branchId, date);
  }
}
