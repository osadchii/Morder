import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Vat } from '../product.model';

class ProductCharacteristicDto {
  @IsString()
  name: string;
  @IsString()
  value: string;
}

export class ProductDto {

  @IsString()
  name: string;

  @IsString()
  articul: string;

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

  @IsString()
  barcode: string;

  @IsEnum(Vat)
  vat: Vat;

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
