import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
}

class TransactionItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number; // Snapshot price at the time of transaction
}

export class CreateTransactionDto {
  @IsNumber()
  totalAmount: number;

  @IsString()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsNumber()
  cashReceived?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];
}
