import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsEnum(['PURCHASE', 'ADJUSTMENT', 'TRANSFER', 'RETURN'])
  type: string;

  @IsInt()
  quantity: number; // positive = add, negative = subtract

  @IsOptional()
  @IsString()
  note?: string;
}
