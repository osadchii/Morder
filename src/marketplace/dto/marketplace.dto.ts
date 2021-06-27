import { MarketplaceType } from '../marketplace.model';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MarketplaceDto {

  @IsString()
  name: string;

  @IsEnum(MarketplaceType)
  type: MarketplaceType;

  @IsBoolean()
  active: boolean;

  @IsBoolean()
  nullifyStocks: boolean;

  @IsNumber()
  @Min(1)
  sendStocksAndPriceEveryMinutes: number;

  @IsNumber()
  warehouseId: number;

  @IsString()
  @IsOptional()
  specialPriceName?: string;
}