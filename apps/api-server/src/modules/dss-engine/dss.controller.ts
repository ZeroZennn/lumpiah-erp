import {
  Controller,
  Get,
  Body,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DssService } from './dss.service';
import { UpdateDssConfigDto } from './dto';
// Setup AuthGuard if authentication is required (assuming JwtAuthGuard exists)
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('dss')
// @UseGuards(JwtAuthGuard)
export class DssController {
  constructor(private readonly dssService: DssService) {}

  @Get('config')
  async getConfig(@Query('branchId', ParseIntPipe) branchId: number) {
    return this.dssService.getWeightConfig(branchId);
  }

  @Put('config')
  async updateConfig(
    @Query('branchId', ParseIntPipe) branchId: number,
    @Body() dto: UpdateDssConfigDto,
  ) {
    return this.dssService.updateWeightConfig(branchId, dto);
  }
}
