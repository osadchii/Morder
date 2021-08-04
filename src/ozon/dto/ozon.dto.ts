import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OzonDto {

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

  @IsBoolean()
  updateFeedStocks: boolean;

  @IsBoolean()
  updateFeedPrices: boolean;

}