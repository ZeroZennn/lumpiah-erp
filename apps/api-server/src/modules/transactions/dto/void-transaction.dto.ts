import { IsString, IsNotEmpty } from 'class-validator';

export class VoidTransactionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
