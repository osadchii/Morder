import { IsNumber, IsString } from 'class-validator';

export class SetPriceDto {

  @IsString()
  erpCode: string;

  @IsNumber()
  price: number;
}