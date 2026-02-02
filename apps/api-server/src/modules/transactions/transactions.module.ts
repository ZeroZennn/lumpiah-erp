import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DailyClosingController } from './daily-closing.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TransactionsController, DailyClosingController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
