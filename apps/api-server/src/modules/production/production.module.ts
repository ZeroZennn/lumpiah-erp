import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { DssEngineModule } from '../dss-engine/dss-engine.module'; // Import DSS Module
import { CommonModule } from '../../common/common.module'; // Assuming Prisma is here or similar

@Module({
  imports: [DssEngineModule, CommonModule],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
