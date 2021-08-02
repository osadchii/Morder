import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SberMegaMarketDto {

  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @IsBoolean()
  nullifyStocks: boolean;

  @IsNumber()
  feedGenerationInterval: number;

  @IsOptional()
  @IsString()
  specialPriceName?: string;

  @IsNumber()
  @Min(0)
  minimalPrice: number;

  @IsNumber()
  outletId: number;
}
