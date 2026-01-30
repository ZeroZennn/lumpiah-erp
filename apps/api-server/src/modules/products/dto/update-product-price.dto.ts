import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateProductPriceDto {
  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}
