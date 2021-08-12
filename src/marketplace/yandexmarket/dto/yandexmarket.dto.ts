import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductType } from '../../../product/product.model';

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
  @Min(0)
  minimalPrice: number;

  @IsOptional()
  @IsNumber()
  defaultHeight?: number;

  @IsOptional()
  @IsNumber()
  defaultLength?: number;

  @IsOptional()
  @IsNumber()
  defaultWidth?: number;

  @IsOptional()
  @IsNumber()
  defaultWeight?: number;

  @IsOptional()
  @IsString()
  defaultVendorCode?: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(ProductType, { each: true })
  productTypes: ProductType[];

}
