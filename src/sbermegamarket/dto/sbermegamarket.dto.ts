import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SberMegaMarketDto {

  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @IsBoolean()
  nullifyStocks: boolean;

  @IsOptional()
  @IsString()
  specialPriceName?: string;

  @IsNumber()
  @Min(0)
  minimalPrice: number;

  @IsNumber()
  feedGenerationInterval: number;

  @IsNumber()
  outletId: number;

  @IsNumber()
  @Min(0)
  @Max(24)
  orderBefore:number;

  @IsNumber()
  shippingDays: number;
}
