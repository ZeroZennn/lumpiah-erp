import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DailyClosingController } from './daily-closing.controller';

@Module({
  controllers: [TransactionsController, DailyClosingController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
