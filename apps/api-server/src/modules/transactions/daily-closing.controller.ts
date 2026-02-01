import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('daily-closing')
@UseGuards(JwtAuthGuard)
export class DailyClosingController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('preview')
  getPreview(@Request() req: { user: { branchId: number } }) {
    return this.transactionsService.getDailyClosingPreview(req.user);
  }

  @Post()
  submitClosing(
    @Body() dto: CreateDailyClosingDto,
    @Request() req: { user: { userId: number; branchId: number } },
  ) {
    return this.transactionsService.createDailyClosing(req.user, dto);
  }
}
