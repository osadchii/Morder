import { IsNumber, IsString, Min } from 'class-validator';

export class SetStockDto {

  @IsString()
  erpCode: string;

  @IsNumber()
  @Min(0)
  stock: number;
}