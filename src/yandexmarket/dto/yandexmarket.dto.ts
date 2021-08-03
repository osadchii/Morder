import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class YandexMarketDto {

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
  feedGenerationInterval: number;

  @IsNumber()
  minimalPrice: number;

}
