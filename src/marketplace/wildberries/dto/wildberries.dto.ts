import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductType } from '../../../product/product.model';

export class WildberriesDto {
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

  @IsArray()
  @ArrayUnique()
  @IsEnum(ProductType, { each: true })
  productTypes: ProductType[];
}
