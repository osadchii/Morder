import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductType } from '../../../product/product.model';

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

  @IsArray()
  @ArrayUnique()
  @IsEnum(ProductType, { each: true })
  productTypes: ProductType[];
}
