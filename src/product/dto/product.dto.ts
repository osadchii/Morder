import {IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, Vat } from '../product.model';

class ProductCharacteristicDto {
  @IsString()
  name: string;
  @IsString()
  value: string;
}

export class ProductDto {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  articul: string;

  @IsNotEmpty()
  @IsString()
  erpCode: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  categoryCode?: string;

  @IsBoolean()
  isDeleted: boolean;

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @IsNotEmpty()
  @IsString()
  barcode: string;

  @IsEnum(Vat)
  vat: Vat;

  @IsEnum(ProductType)
  productType: ProductType;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  vendorCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => ProductCharacteristicDto)
  characteristics?: ProductCharacteristicDto[];

}
