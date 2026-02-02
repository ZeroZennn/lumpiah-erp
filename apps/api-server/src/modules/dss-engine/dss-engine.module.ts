import { Module } from '@nestjs/common';
import { DssController } from './dss.controller';
import { DssService } from './dss.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [DssController],
  providers: [DssService],
  exports: [DssService], // Export Service so ProductionModule can use it
})
export class DssEngineModule {}
