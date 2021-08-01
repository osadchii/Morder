import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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
}
