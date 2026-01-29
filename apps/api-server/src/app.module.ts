import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DssEngineModule } from './modules/dss-engine/dss-engine.module';
import { ProductionModule } from './modules/production/production.module';
import { HrModule } from './modules/hr/hr.module';
import { UsersModule } from './modules/users/users.module';
import { SystemModule } from './modules/system/system.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    PosModule,
    InventoryModule,
    ReportsModule,
    BranchesModule,
    DssEngineModule,
    ProductionModule,
    HrModule,
    UsersModule,
    SystemModule,
    CommonModule,
    AuthModule,
    ProductsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
