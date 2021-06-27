import { IsNumber, IsString, Min } from 'class-validator';

export class SetPriceDto {

  @IsString()
  erpCode: string;

  @IsNumber()
  @Min(0)
  price: number;
}