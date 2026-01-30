import { IsArray, IsNumber, Max, Min } from 'class-validator';

export class CreateDssConfigDto {
  @IsArray()
  wmaWeights: number[];

  @IsNumber()
  @Min(0)
  @Max(100)
  safetyStockPercent: number;
}

export class UpdateDssConfigDto extends CreateDssConfigDto {}
