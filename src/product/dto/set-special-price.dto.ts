import { IsNumber, IsString, Min } from 'class-validator';

export class SetSpecialPriceDto{

  @IsString()
  erpCode:string;

  @IsString()
  priceName:string;

  @IsNumber()
  @Min(0.01)
  price: number;
}