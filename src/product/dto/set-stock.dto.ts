import { IsNumber, IsString } from 'class-validator';

export class SetStockDto {
  @IsString()
  erpCode: string;

  @IsNumber()
  stock: number;
}