import { IsString, IsNotEmpty } from 'class-validator';

export class VoidTransactionDto {
  @IsString()
  @IsNotEmpty()
  adminUsername: string;

  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
