import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseArrayPipe,
  Query,
  Header,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindAllTransactionsDto } from './dto/find-all-transactions.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() req: { user: { userId: number; branchId: number } },
  ) {
    return this.transactionsService.create(
      createTransactionDto,
      req.user.userId, // Changed from req.user.id to req.user.userId
      req.user.branchId,
    );
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(
    @Body(new ParseArrayPipe({ items: CreateTransactionDto }))
    transactions: CreateTransactionDto[],
    @Request() req: { user: { userId: number; branchId: number } },
  ) {
    return this.transactionsService.syncBatch(
      transactions,
      req.user.userId,
      req.user.branchId,
    );
  }

  @Get()
  findAll(@Query() query: FindAllTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transactions.csv"')
  async export(@Query() query: FindAllTransactionsDto) {
    return this.transactionsService.generateCsv(query);
  }

  @Get('summary')
  getSummary(@Query() query: FindAllTransactionsDto) {
    return this.transactionsService.getSummary(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post(':id/void')
  voidTransaction(
    @Param('id') id: string,
    @Body() voidDto: VoidTransactionDto,
    @Request() req: { user: { userId: number } },
  ) {
    return this.transactionsService.processVoid(
      id,
      voidDto.reason,
      req.user.userId,
    );
  }

  @Post(':id/reject-void')
  rejectVoid(@Param('id') id: string) {
    return this.transactionsService.rejectVoid(id);
  }
}
